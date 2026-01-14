-- ============================================
-- PAYPAL CHECKOUT WEBHOOK INTEGRATION MIGRATION
-- Adds support for tracking PayPal captures and
-- ensuring idempotent order fulfillment
-- ============================================

-- ============================================
-- 1. ADD PAYPAL CAPTURE ID TO ORDERS (Idempotency)
-- ============================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT UNIQUE;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_paypal_capture_id 
ON orders(paypal_capture_id) WHERE paypal_capture_id IS NOT NULL;

-- ============================================
-- 2. ADD PAYPAL CAPTURE ID TO SELLER_EARNINGS
-- ============================================
ALTER TABLE seller_earnings
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT;

-- ============================================
-- 3. WEBHOOK AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL, -- 'paypal_checkout', 'paypal_payout', etc.
  event_type TEXT NOT NULL,
  resource_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_resource_id ON webhook_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- ============================================
-- 4. RPC FUNCTION: Fulfill Order (Atomic Transaction)
-- ============================================
-- This function handles the entire order fulfillment process atomically:
-- 1. Updates order status to 'paid'
-- 2. Records seller earnings for each order item
-- 3. Returns success/failure status

CREATE OR REPLACE FUNCTION fulfill_order_from_webhook(
  p_order_id UUID,
  p_paypal_capture_id TEXT,
  p_escrow_days INTEGER DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_platform_fee NUMERIC;
  v_net_amount NUMERIC;
  v_release_date TIMESTAMPTZ;
  v_earnings_count INTEGER := 0;
BEGIN
  -- Check if already processed (idempotency)
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Check if already fulfilled with this capture ID
  IF v_order.paypal_capture_id = p_paypal_capture_id THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already processed', 'idempotent', true);
  END IF;
  
  -- Check if order already paid
  IF v_order.status = 'paid' THEN
    -- Still update capture ID if missing
    IF v_order.paypal_capture_id IS NULL THEN
      UPDATE orders SET paypal_capture_id = p_paypal_capture_id WHERE id = p_order_id;
    END IF;
    RETURN jsonb_build_object('success', true, 'message', 'Order already paid', 'idempotent', true);
  END IF;
  
  -- Calculate release date for escrow
  v_release_date := NOW() + (p_escrow_days || ' days')::INTERVAL;
  
  -- Update order status and capture ID
  UPDATE orders 
  SET 
    status = 'paid',
    paypal_capture_id = p_paypal_capture_id,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Process each order item and record seller earnings
  FOR v_item IN 
    SELECT oi.*, p.seller_id 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = p_order_id
  LOOP
    -- Skip if seller_id is null (shouldn't happen but safety check)
    IF v_item.seller_id IS NOT NULL THEN
      -- Calculate 90/10 split (90% to seller, 10% platform fee)
      v_platform_fee := ROUND(v_item.price * 0.10, 2);
      v_net_amount := v_item.price - v_platform_fee;
      
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
        release_date,
        paypal_capture_id
      ) VALUES (
        v_item.seller_id,
        p_order_id,
        v_item.id,
        v_item.product_id,
        v_item.price,
        v_platform_fee,
        v_net_amount,
        'escrow',
        v_release_date,
        p_paypal_capture_id
      );
      
      -- Update seller's pending balance
      UPDATE sellers
      SET 
        pending_balance = COALESCE(pending_balance, 0) + v_net_amount,
        total_earnings = COALESCE(total_earnings, 0) + v_net_amount,
        updated_at = NOW()
      WHERE id = v_item.seller_id;
      
      v_earnings_count := v_earnings_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Order fulfilled successfully',
    'order_id', p_order_id,
    'earnings_recorded', v_earnings_count
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically, return error
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM,
    'order_id', p_order_id
  );
END;
$$;

-- ============================================
-- 5. RLS FOR WEBHOOK_LOGS (Admin Only)
-- ============================================
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view webhook logs" ON webhook_logs;
CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Service role can insert (webhooks run server-side)
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON webhook_logs;
CREATE POLICY "Service role can insert webhook logs"
  ON webhook_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
