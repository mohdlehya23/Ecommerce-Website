-- ============================================
-- SELLER PAYOUT SYSTEM MIGRATION
-- Escrow-based payout with 90/10 commission split
-- ============================================

-- 1. UPDATE SELLERS TABLE
-- ============================================
-- Add payout_paypal_email if not exists (may already have payout_email)
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS payout_paypal_email TEXT;

-- Add balance tracking columns
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_balance NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(10,2) DEFAULT 0;

-- Copy existing payout_email to payout_paypal_email if exists
UPDATE sellers 
SET payout_paypal_email = payout_email 
WHERE payout_email IS NOT NULL AND payout_paypal_email IS NULL;

-- ============================================
-- 2. SELLER EARNINGS TABLE (Escrow Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS seller_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Financial breakdown
  gross_amount NUMERIC(10,2) NOT NULL,           -- Full sale price
  platform_fee NUMERIC(10,2) NOT NULL,           -- 10% commission
  net_amount NUMERIC(10,2) NOT NULL,             -- 90% to seller
  
  -- Escrow timing
  status TEXT NOT NULL DEFAULT 'escrow' 
    CHECK (status IN ('escrow', 'available', 'paid', 'refunded')),
  release_date TIMESTAMPTZ NOT NULL,              -- When funds become available (14 days after purchase)
  released_at TIMESTAMPTZ,                        -- When actually released from escrow
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller_id ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_release_date ON seller_earnings(release_date);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_order_id ON seller_earnings(order_id);

-- ============================================
-- 3. PAYOUT REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  
  -- Payout details
  amount NUMERIC(10,2) NOT NULL,
  payout_email TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- PayPal integration
  paypal_batch_id TEXT,
  paypal_payout_item_id TEXT,
  paypal_transaction_id TEXT,
  paypal_response JSONB,
  
  -- Admin tracking
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_id ON payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- ============================================
-- 4. RPC FUNCTION: Record Seller Earnings (Atomic)
-- ============================================
-- Called when an order is completed to calculate and store seller earnings
CREATE OR REPLACE FUNCTION record_seller_earnings(
  p_order_id UUID,
  p_order_item_id UUID,
  p_seller_id UUID,
  p_product_id UUID,
  p_gross_amount NUMERIC,
  p_escrow_days INTEGER DEFAULT 14
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_platform_fee NUMERIC;
  v_net_amount NUMERIC;
  v_release_date TIMESTAMPTZ;
  v_earning_id UUID;
BEGIN
  -- Calculate 90/10 split
  v_platform_fee := ROUND(p_gross_amount * 0.10, 2);
  v_net_amount := p_gross_amount - v_platform_fee;
  v_release_date := NOW() + (p_escrow_days || ' days')::INTERVAL;
  
  -- Insert earnings record
  INSERT INTO seller_earnings (
    seller_id,
    order_id,
    order_item_id,
    product_id,
    gross_amount,
    platform_fee,
    net_amount,
    status,
    release_date
  ) VALUES (
    p_seller_id,
    p_order_id,
    p_order_item_id,
    p_product_id,
    p_gross_amount,
    v_platform_fee,
    v_net_amount,
    'escrow',
    v_release_date
  ) RETURNING id INTO v_earning_id;
  
  -- Update seller's pending balance
  UPDATE sellers
  SET 
    pending_balance = pending_balance + v_net_amount,
    total_earnings = total_earnings + v_net_amount,
    updated_at = NOW()
  WHERE id = p_seller_id;
  
  RETURN v_earning_id;
END;
$$;

-- ============================================
-- 5. RPC FUNCTION: Release Escrow (Daily Cron)
-- ============================================
-- Called by cron job to release funds from escrow
CREATE OR REPLACE FUNCTION release_escrow_funds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_released_count INTEGER := 0;
  v_earning RECORD;
BEGIN
  -- Find all earnings past their release date that are still in escrow
  FOR v_earning IN 
    SELECT id, seller_id, net_amount 
    FROM seller_earnings 
    WHERE status = 'escrow' 
      AND release_date <= NOW()
  LOOP
    -- Update earning status
    UPDATE seller_earnings
    SET 
      status = 'available',
      released_at = NOW(),
      updated_at = NOW()
    WHERE id = v_earning.id;
    
    -- Move from pending to available balance
    UPDATE sellers
    SET 
      pending_balance = pending_balance - v_earning.net_amount,
      available_balance = available_balance + v_earning.net_amount,
      updated_at = NOW()
    WHERE id = v_earning.seller_id;
    
    v_released_count := v_released_count + 1;
  END LOOP;
  
  RETURN v_released_count;
END;
$$;

-- ============================================
-- 6. RPC FUNCTION: Request Payout
-- ============================================
CREATE OR REPLACE FUNCTION request_payout(
  p_seller_id UUID,
  p_amount NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available NUMERIC;
  v_payout_email TEXT;
  v_request_id UUID;
BEGIN
  -- Get seller's available balance and payout email
  SELECT available_balance, COALESCE(payout_paypal_email, payout_email)
  INTO v_available, v_payout_email
  FROM sellers
  WHERE id = p_seller_id;
  
  -- Validate minimum payout ($10)
  IF p_amount < 10 THEN
    RAISE EXCEPTION 'Minimum payout amount is $10';
  END IF;
  
  -- Validate sufficient balance
  IF p_amount > v_available THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;
  
  -- Validate payout email exists
  IF v_payout_email IS NULL OR v_payout_email = '' THEN
    RAISE EXCEPTION 'Payout email not configured';
  END IF;
  
  -- Create payout request
  INSERT INTO payout_requests (
    seller_id,
    amount,
    payout_email,
    status
  ) VALUES (
    p_seller_id,
    p_amount,
    v_payout_email,
    'pending'
  ) RETURNING id INTO v_request_id;
  
  -- Deduct from available balance (held for payout)
  UPDATE sellers
  SET 
    available_balance = available_balance - p_amount,
    updated_at = NOW()
  WHERE id = p_seller_id;
  
  RETURN v_request_id;
END;
$$;

-- ============================================
-- 7. RPC FUNCTION: Complete Payout (Admin)
-- ============================================
CREATE OR REPLACE FUNCTION complete_payout(
  p_request_id UUID,
  p_admin_id UUID,
  p_paypal_batch_id TEXT DEFAULT NULL,
  p_paypal_transaction_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE payout_requests
  SET 
    status = 'completed',
    paypal_batch_id = p_paypal_batch_id,
    paypal_transaction_id = p_paypal_transaction_id,
    processed_by = p_admin_id,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id AND status IN ('pending', 'processing');
  
  RETURN FOUND;
END;
$$;

-- ============================================
-- 8. RPC FUNCTION: Fail Payout (Admin/System)
-- ============================================
CREATE OR REPLACE FUNCTION fail_payout(
  p_request_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id UUID;
  v_amount NUMERIC;
BEGIN
  -- Get payout details
  SELECT seller_id, amount 
  INTO v_seller_id, v_amount
  FROM payout_requests
  WHERE id = p_request_id AND status IN ('pending', 'processing');
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as failed
  UPDATE payout_requests
  SET 
    status = 'failed',
    failure_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Refund to available balance
  UPDATE sellers
  SET 
    available_balance = available_balance + v_amount,
    updated_at = NOW()
  WHERE id = v_seller_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Sellers can only view their own earnings
DROP POLICY IF EXISTS "Sellers can view own earnings" ON seller_earnings;
CREATE POLICY "Sellers can view own earnings"
  ON seller_earnings FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Sellers can only view their own payout requests
DROP POLICY IF EXISTS "Sellers can view own payouts" ON payout_requests;
CREATE POLICY "Sellers can view own payouts"
  ON payout_requests FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Sellers can request payouts (via RPC function)
DROP POLICY IF EXISTS "Sellers can request payouts" ON payout_requests;
CREATE POLICY "Sellers can request payouts"
  ON payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Admins can view all earnings
DROP POLICY IF EXISTS "Admins can view all earnings" ON seller_earnings;
CREATE POLICY "Admins can view all earnings"
  ON seller_earnings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Admins can view all payout requests
DROP POLICY IF EXISTS "Admins can view all payouts" ON payout_requests;
CREATE POLICY "Admins can view all payouts"
  ON payout_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );
