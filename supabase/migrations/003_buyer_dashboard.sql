-- ============================================
-- Buyer Dashboard Enhancement Migration
-- IDEMPOTENT: Can be run multiple times safely
-- ============================================

-- ============================================
-- 1. PROFILES: Add invoice/company fields
-- ============================================

-- Personal address fields (for individual invoices)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Business-specific fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vat_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_notes TEXT;

-- ============================================
-- 2. ORDERS: Add receipt support fields
-- ============================================

-- Buyer info for receipts (store at checkout time)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name TEXT;

-- Receipt token for public access (like Gumroad)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_token TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_token_created_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_token_expires_at TIMESTAMPTZ;

-- Resend tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_receipt_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_send_count INT DEFAULT 0;

-- PayPal capture ID (if not already)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT;

-- Create unique index on receipt_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_receipt_token ON orders(receipt_token) WHERE receipt_token IS NOT NULL;

-- ============================================
-- 3. ORDER_ITEMS: Ensure seller_id exists
-- ============================================
-- Already handled in 002_multi_seller.sql, but ensure it exists
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);

-- ============================================
-- 4. SECURITY: Remove client UPDATE on orders
-- ============================================
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
-- payment_status updates happen server-side only with service role

-- ============================================
-- 5. RLS POLICIES: Ensure proper security
-- ============================================

-- PROFILES: User can only SELECT/UPDATE own row
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ORDERS: Only owner can SELECT/INSERT, NO UPDATE from client
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ORDER_ITEMS: Only if parent order belongs to user
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- PRODUCTS: Published products are public, seller can manage own
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Public can view published products" ON products;
CREATE POLICY "Public can view published products" ON products
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR status IS NULL);

DROP POLICY IF EXISTS "Seller can view own products" ON products;
CREATE POLICY "Seller can view own products" ON products
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- NEWSLETTER: Allow INSERT for anyone
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 6. FUNCTION: Generate receipt token
-- ============================================
CREATE OR REPLACE FUNCTION generate_receipt_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FUNCTION: Set receipt token on order creation
-- ============================================
CREATE OR REPLACE FUNCTION set_order_receipt_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_token IS NULL THEN
    NEW.receipt_token := generate_receipt_token();
    NEW.receipt_token_created_at := NOW();
    NEW.receipt_token_expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_created_set_token ON orders;
CREATE TRIGGER on_order_created_set_token
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_receipt_token();
