-- ============================================
-- FIX: Infinite Recursion in Orders RLS Policy
-- Run this AFTER 003_buyer_dashboard.sql
-- ============================================

-- The infinite recursion is caused by the trigger + RLS interaction.
-- Solution: Simplify policies and ensure trigger uses SECURITY DEFINER correctly.

-- 1. Drop all existing policies on orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Sellers can view orders with their products" ON orders;

-- 2. Create simple, non-recursive policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. Fix the trigger function to be SECURITY DEFINER and avoid policy checks
CREATE OR REPLACE FUNCTION set_order_receipt_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_token IS NULL THEN
    NEW.receipt_token := encode(gen_random_bytes(32), 'hex');
    NEW.receipt_token_created_at := NOW();
    NEW.receipt_token_expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate trigger
DROP TRIGGER IF EXISTS on_order_created_set_token ON orders;
CREATE TRIGGER on_order_created_set_token
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_receipt_token();

-- 5. Also fix order_items policies to avoid recursion
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

-- Simple policy without nested SELECT on orders during insert
-- For SELECT: check if user owns the parent order
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- For INSERT: allow if order_id references an order owned by the user
-- Use a simpler check that doesn't cause recursion
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );
