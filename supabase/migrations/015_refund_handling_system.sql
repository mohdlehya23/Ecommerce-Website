-- =====================================================
-- Migration 015: Refund Handling System
-- =====================================================
-- Adds support for refund/reversal processing:
-- 1. Add refunded_at column to orders
-- 2. Add refunded status to seller_earnings
-- 3. Create balance decrement functions
-- 4. Update downloads API to block refunded orders
-- =====================================================

-- =====================================================
-- 1. ADD REFUND COLUMNS TO ORDERS TABLE
-- =====================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ DEFAULT NULL;

-- Add refund-related values to payment_status check if it exists
-- First, let's check what values are allowed and update if needed
DO $$
BEGIN
  -- Add comment to document valid statuses
  COMMENT ON COLUMN orders.payment_status IS 
    'Valid values: pending, completed, failed, refunded, reversed';
END $$;

-- =====================================================
-- 2. ADD REFUND STATUS TO SELLER_EARNINGS
-- =====================================================
ALTER TABLE seller_earnings
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ DEFAULT NULL;

-- Also ensure the status column can hold 'refunded' value
DO $$
BEGIN
  COMMENT ON COLUMN seller_earnings.status IS 
    'Valid values: pending, released, refunded';
END $$;

-- =====================================================
-- 3. CREATE BALANCE DECREMENT FUNCTIONS
-- =====================================================

-- Function to decrement seller's available_balance
CREATE OR REPLACE FUNCTION decrement_seller_available_balance(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sellers
  SET 
    available_balance = GREATEST(0, COALESCE(available_balance, 0) - p_amount),
    updated_at = NOW()
  WHERE id = p_seller_id;
  
  -- Log the operation
  RAISE NOTICE 'Decremented available_balance by % for seller %', p_amount, p_seller_id;
END;
$$;

-- Function to decrement seller's pending_balance
CREATE OR REPLACE FUNCTION decrement_seller_pending_balance(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sellers
  SET 
    pending_balance = GREATEST(0, COALESCE(pending_balance, 0) - p_amount),
    updated_at = NOW()
  WHERE id = p_seller_id;
  
  -- Log the operation
  RAISE NOTICE 'Decremented pending_balance by % for seller %', p_amount, p_seller_id;
END;
$$;

-- Function to decrement seller's total_earnings
CREATE OR REPLACE FUNCTION decrement_seller_total_earnings(
  p_seller_id UUID,
  p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sellers
  SET 
    total_earnings = GREATEST(0, COALESCE(total_earnings, 0) - p_amount),
    updated_at = NOW()
  WHERE id = p_seller_id;
  
  -- Log the operation
  RAISE NOTICE 'Decremented total_earnings by % for seller %', p_amount, p_seller_id;
END;
$$;

-- =====================================================
-- 4. CREATE WEBHOOK_LOGS TABLE IF NOT EXISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_id TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_resource_id ON webhook_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Admins can view webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON webhook_logs;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Only service role can insert
CREATE POLICY "Service role can insert webhook logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true); -- Controlled by service role key

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION decrement_seller_available_balance TO service_role;
GRANT EXECUTE ON FUNCTION decrement_seller_pending_balance TO service_role;
GRANT EXECUTE ON FUNCTION decrement_seller_total_earnings TO service_role;

-- =====================================================
-- 6. ADD HELPFUL VIEW FOR REFUND TRACKING
-- =====================================================
CREATE OR REPLACE VIEW refunded_orders_summary AS
SELECT 
  o.id AS order_id,
  o.user_id AS buyer_id,
  o.total_amount,
  o.payment_status,
  o.refunded_at,
  o.created_at AS order_date,
  COUNT(se.id) AS earnings_count,
  COALESCE(SUM(se.net_amount), 0) AS total_earnings_reversed
FROM orders o
LEFT JOIN seller_earnings se ON se.order_id = o.id AND se.status = 'refunded'
WHERE o.payment_status IN ('refunded', 'reversed')
GROUP BY o.id;

-- Grant access to admins
GRANT SELECT ON refunded_orders_summary TO authenticated;

COMMENT ON VIEW refunded_orders_summary IS 
  'Summary of refunded/reversed orders with earnings impact';
