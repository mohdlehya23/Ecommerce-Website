-- ============================================
-- Digital E-commerce Platform Database Schema
-- Run this in Supabase SQL Editor
-- IDEMPOTENT: Can be run multiple times safely
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extends Supabase auth.users with custom fields
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  user_type TEXT DEFAULT 'individual' CHECK (user_type IN ('individual', 'business')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles (drop first for idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_b2c NUMERIC(10,2) NOT NULL,
  price_b2b NUMERIC(10,2) NOT NULL,
  category TEXT CHECK (category IN ('ebooks', 'templates', 'consulting')),
  product_type TEXT CHECK (product_type IN ('virtual', 'downloadable')),
  image_url TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products (drop first for idempotency)
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  paypal_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view own orders (drop first for idempotency)
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own orders (drop first for idempotency)
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SECURITY: Remove any UPDATE policy on orders (payment_status is server-only)
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  license_type TEXT CHECK (license_type IN ('personal', 'commercial')),
  price NUMERIC(10,2) NOT NULL
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can view order items for their orders (drop first for idempotency)
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Users can insert order items for their orders (drop first for idempotency)
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (drop first for idempotency)
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- ============================================
-- SAMPLE PRODUCTS (remove in production)
-- ============================================
INSERT INTO products (title, slug, description, price_b2c, price_b2b, category, product_type, image_url) VALUES
  (
    'Complete Business Strategy Guide',
    'complete-business-strategy-guide',
    'A comprehensive guide to developing winning business strategies. Learn from real-world case studies and proven frameworks.',
    29.99,
    99.99,
    'ebooks',
    'downloadable',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800'
  ),
  (
    'Professional Dashboard Template',
    'professional-dashboard-template',
    'Modern, responsive admin dashboard template built with React and Tailwind CSS. Includes 50+ components.',
    49.99,
    149.99,
    'templates',
    'downloadable',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'
  ),
  (
    '1-Hour Strategy Consultation',
    'strategy-consultation-1h',
    'One-on-one consultation session with our expert strategists. Get personalized advice for your business challenges.',
    149.99,
    299.99,
    'consulting',
    'virtual',
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800'
  ),
  (
    'Marketing Automation Playbook',
    'marketing-automation-playbook',
    'Master marketing automation with this step-by-step playbook. Includes templates, workflows, and best practices.',
    34.99,
    119.99,
    'ebooks',
    'downloadable',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'
  ),
  (
    'E-commerce Website Template',
    'ecommerce-website-template',
    'Complete e-commerce template with shopping cart, checkout, and admin panel. Ready to deploy.',
    79.99,
    249.99,
    'templates',
    'downloadable',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800'
  ),
  (
    'Product Launch Strategy Session',
    'product-launch-session',
    'Comprehensive product launch strategy planning session. 2 hours with our product experts.',
    249.99,
    449.99,
    'consulting',
    'virtual',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'individual')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
