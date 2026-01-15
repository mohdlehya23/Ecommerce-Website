-- ============================================
-- SECURITY & MODERATION SYSTEM MIGRATION
-- Implements seller suspension, buyer file protection,
-- payout restrictions, and comprehensive RLS policies
-- ============================================

-- ============================================
-- 1. SELLER MODERATION COLUMN (DDL)
-- Add is_suspended flag for instant moderation
-- ============================================
ALTER TABLE sellers
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_sellers_is_suspended 
ON sellers(is_suspended) WHERE is_suspended = true;

-- Add suspension metadata columns
ALTER TABLE sellers
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- ============================================
-- 2. DATA INTEGRITY NOTE
-- NOT NULL constraints should be verified against actual schema
-- Skipping ALTER COLUMN constraints to avoid errors on non-existent columns
-- ============================================

-- Note: Run these only if the columns exist:
-- ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE order_items ALTER COLUMN price SET NOT NULL;
-- etc.

-- ============================================
-- 3. BUYER FILE PROTECTION (RLS)
-- Users can only download if they have a paid order
-- ============================================

-- Policy: Buyers can only view order_items for their paid orders
DROP POLICY IF EXISTS "Buyers can view own paid order items" ON order_items;
CREATE POLICY "Buyers can view own paid order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
        AND orders.payment_status = 'completed'
    )
  );

-- Policy: Sellers can view order items for their products
DROP POLICY IF EXISTS "Sellers can view their product order items" ON order_items;
CREATE POLICY "Sellers can view their product order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = order_items.product_id 
        AND products.seller_id = auth.uid()
    )
  );

-- ============================================
-- 4. PAYOUT PROTECTION (RLS)
-- Suspended sellers cannot request payouts
-- ============================================

-- Drop existing insert policy
DROP POLICY IF EXISTS "Seller can request payout" ON payout_requests;
DROP POLICY IF EXISTS "Sellers can request payouts" ON payout_requests;

-- New policy: Only non-suspended sellers can insert payout requests
CREATE POLICY "Non-suspended sellers can request payouts"
  ON payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM sellers 
      WHERE sellers.id = auth.uid() 
        AND (sellers.is_suspended = true OR sellers.seller_status = 'suspended')
    )
  );

-- Sellers can view their own payout requests
DROP POLICY IF EXISTS "Sellers can view own payout requests" ON payout_requests;
CREATE POLICY "Sellers can view own payout requests"
  ON payout_requests FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- ============================================
-- 5. PRODUCT VISIBILITY (RLS)
-- Hide products from suspended sellers
-- ============================================

-- Public products: Only show from non-suspended sellers with published status
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON products;
CREATE POLICY "Public products are viewable by everyone"
  ON products FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM sellers 
      WHERE sellers.id = products.seller_id 
        AND sellers.is_suspended = false
        AND sellers.seller_status = 'active'
    )
  );

-- Sellers can always view their own products
DROP POLICY IF EXISTS "Sellers can view own products" ON products;
CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- ============================================
-- 6. SELLER EARNINGS PROTECTION (RLS)
-- Ensure sellers can only see their own earnings
-- ============================================

DROP POLICY IF EXISTS "Sellers can view own earnings" ON seller_earnings;
CREATE POLICY "Sellers can view own earnings"
  ON seller_earnings FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Prevent direct inserts (must go through RPC)
DROP POLICY IF EXISTS "No direct insert to seller_earnings" ON seller_earnings;
-- (Handled by not having an INSERT policy for authenticated users)

-- ============================================
-- 7. ADMIN FULL ACCESS POLICIES
-- Admins can view and manage all data
-- ============================================

-- Admin audit logs - admins only
DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = auth.uid()
    AND EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Admins can view all payout requests
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;
CREATE POLICY "Admins can view all payout requests"
  ON payout_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Admins can update payout requests
DROP POLICY IF EXISTS "Admins can update payout requests" ON payout_requests;
CREATE POLICY "Admins can update payout requests"
  ON payout_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Admins can view all seller earnings
DROP POLICY IF EXISTS "Admins can view all seller earnings" ON seller_earnings;
CREATE POLICY "Admins can view all seller earnings"
  ON seller_earnings FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Admins can view all order items
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ============================================
-- 8. HELPER FUNCTION: Suspend Seller
-- Admin-only function to suspend/unsuspend sellers
-- ============================================

CREATE OR REPLACE FUNCTION suspend_seller(
  p_seller_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_suspend BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller RECORD;
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = p_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Get seller
  SELECT * INTO v_seller FROM sellers WHERE id = p_seller_id;
  
  IF v_seller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller not found');
  END IF;

  -- Update seller
  IF p_suspend THEN
    UPDATE sellers
    SET 
      is_suspended = true,
      seller_status = 'suspended',
      suspended_at = NOW(),
      suspended_by = p_admin_id,
      suspension_reason = p_reason,
      updated_at = NOW()
    WHERE id = p_seller_id;
  ELSE
    UPDATE sellers
    SET 
      is_suspended = false,
      seller_status = 'active',
      suspended_at = NULL,
      suspended_by = NULL,
      suspension_reason = NULL,
      updated_at = NOW()
    WHERE id = p_seller_id;
  END IF;

  -- Log the action
  INSERT INTO admin_audit_logs (admin_id, action, entity_type, entity_id, before, after)
  VALUES (
    p_admin_id,
    CASE WHEN p_suspend THEN 'suspend_seller' ELSE 'unsuspend_seller' END,
    'seller',
    p_seller_id,
    jsonb_build_object('is_suspended', v_seller.is_suspended),
    jsonb_build_object('is_suspended', p_suspend, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'seller_id', p_seller_id,
    'is_suspended', p_suspend
  );
END;
$$;

-- ============================================
-- 9. HELPER FUNCTION: Check Download Permission
-- Verifies buyer has purchased the product
-- ============================================

CREATE OR REPLACE FUNCTION can_download_product(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = p_user_id
      AND oi.product_id = p_product_id
      AND o.payment_status = 'completed'
  );
END;
$$;
