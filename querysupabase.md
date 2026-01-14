# Supabase SQL Setup for Multi-Seller Marketplace

This document contains all SQL queries to set up a **Gumroad-style multi-seller marketplace** with proper RLS isolation.

---

## Migration Order

1. Create/Update Tables
2. Create Indexes
3. Enable RLS
4. Create RLS Policies
5. Create Triggers & Functions
6. Storage Setup

---

## 1. Base Tables (Already Exist)

```sql
-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    user_type TEXT NOT NULL DEFAULT 'individual' CHECK (user_type IN ('individual', 'business')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NEWSLETTER_SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. Multi-Seller Tables (NEW)

### 2A. Sellers Table

```sql
-- ============================================
-- SELLERS TABLE (1:1 with auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    seller_status TEXT NOT NULL DEFAULT 'payouts_locked'
        CHECK (seller_status IN ('active', 'payouts_locked', 'suspended')),
    payout_email TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Platform fee %
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sellers_username ON sellers(username);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(seller_status);
```

### 2B. Products Table (Updated for Multi-Seller)

```sql
-- ============================================
-- PRODUCTS TABLE (with seller_id + status)
-- ============================================
-- Add columns to existing products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
```

### 2C. Store Builder Tables

```sql
-- ============================================
-- STORE PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS store_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (seller_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_store_pages_seller ON store_pages(seller_id);

-- ============================================
-- PAGE SECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES store_pages(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('products', 'featured', 'text', 'subscribe', 'posts')),
    title TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page_id);
```

### 2D. Seller Posts Table

```sql
-- ============================================
-- SELLER POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS seller_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (seller_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_seller_posts_seller ON seller_posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_posts_status ON seller_posts(status);
```

### 2E. Payouts Table

```sql
-- ============================================
-- PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'held', 'failed')),
    payout_method TEXT DEFAULT 'paypal',
    transaction_id TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
```

### 2F. Orders Table (Updated for Multi-Seller)

```sql
-- Add seller tracking to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);
```

---

## 3. Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
```

---

## 4. RLS Policies

### 4A. Profiles Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
```

### 4B. Products Policies (Multi-Seller)

```sql
-- Remove old policy if exists
DROP POLICY IF EXISTS "Anyone can view products" ON products;

-- Public can view ONLY published products
CREATE POLICY "Public can view published products"
    ON products FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Sellers can insert their own products
CREATE POLICY "Seller can insert own products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (seller_id = auth.uid());

-- Sellers can update their own products
CREATE POLICY "Seller can update own products"
    ON products FOR UPDATE
    TO authenticated
    USING (seller_id = auth.uid());

-- Sellers can delete their own products
CREATE POLICY "Seller can delete own products"
    ON products FOR DELETE
    TO authenticated
    USING (seller_id = auth.uid());

-- Sellers can view their own products (including drafts)
CREATE POLICY "Seller can view own products"
    ON products FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());
```

### 4C. Sellers Policies

```sql
-- Public can view non-suspended sellers
CREATE POLICY "Public can view active sellers"
    ON sellers FOR SELECT
    TO anon, authenticated
    USING (seller_status <> 'suspended');

-- Users can create their own seller profile
CREATE POLICY "User can create own seller profile"
    ON sellers FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Sellers can update their own profile
CREATE POLICY "Seller can update own profile"
    ON sellers FOR UPDATE
    TO authenticated
    USING (id = auth.uid());
```

### 4D. Store Pages Policies

```sql
-- Public can view published pages
CREATE POLICY "Public can view published store pages"
    ON store_pages FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

-- Sellers can view all their pages
CREATE POLICY "Seller can view own pages"
    ON store_pages FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());

-- Sellers can manage their pages
CREATE POLICY "Seller can insert own pages"
    ON store_pages FOR INSERT
    TO authenticated
    WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Seller can update own pages"
    ON store_pages FOR UPDATE
    TO authenticated
    USING (seller_id = auth.uid());

CREATE POLICY "Seller can delete own pages"
    ON store_pages FOR DELETE
    TO authenticated
    USING (seller_id = auth.uid());
```

### 4E. Page Sections Policies

```sql
-- Public can view sections of published pages
CREATE POLICY "Public can view sections of published pages"
    ON page_sections FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM store_pages sp
            WHERE sp.id = page_sections.page_id
            AND sp.is_published = true
        )
    );

-- Sellers can manage sections of their pages
CREATE POLICY "Seller can manage own sections"
    ON page_sections FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM store_pages sp
            WHERE sp.id = page_sections.page_id
            AND sp.seller_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM store_pages sp
            WHERE sp.id = page_sections.page_id
            AND sp.seller_id = auth.uid()
        )
    );
```

### 4F. Seller Posts Policies

```sql
-- Public can view published posts
CREATE POLICY "Public can view published posts"
    ON seller_posts FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Sellers can view their own posts
CREATE POLICY "Seller can view own posts"
    ON seller_posts FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());

-- Sellers can manage their posts
CREATE POLICY "Seller can insert own posts"
    ON seller_posts FOR INSERT
    TO authenticated
    WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Seller can update own posts"
    ON seller_posts FOR UPDATE
    TO authenticated
    USING (seller_id = auth.uid());

CREATE POLICY "Seller can delete own posts"
    ON seller_posts FOR DELETE
    TO authenticated
    USING (seller_id = auth.uid());
```

### 4G. Orders Policies (SECURE - No Client Updates)

```sql
-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create orders (payment status set to pending by default)
CREATE POLICY "Users can create own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id AND payment_status = 'pending');

-- REMOVE UPDATE POLICY - payment_status should only be updated via server
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- Sellers can view orders containing their products
CREATE POLICY "Sellers can view orders with their products"
    ON orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            WHERE oi.order_id = orders.id
            AND oi.seller_id = auth.uid()
        )
    );
```

### 4H. Order Items Policies

```sql
-- Users can view their own order items
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Users can insert order items
CREATE POLICY "Users can insert own order items"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Sellers can view order items for their products
CREATE POLICY "Sellers can view their order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());
```

### 4I. Payouts Policies

```sql
-- Sellers can view their own payouts
CREATE POLICY "Seller can view own payouts"
    ON payouts FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());

-- Only server/admin can insert/update payouts (no client policies for write)
```

### 4J. Newsletter Policies

```sql
-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
    ON newsletter_subscribers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
```

---

## 5. Triggers & Functions

### 5A. Auto-Create Profile on Signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, user_type)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'individual')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### 5B. Update Order Payment Status (Server Only)

```sql
-- Function to update order payment status (called from server only)
CREATE OR REPLACE FUNCTION update_order_payment_status(
    p_order_id UUID,
    p_status TEXT,
    p_paypal_order_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE orders
    SET payment_status = p_status,
        paypal_order_id = COALESCE(p_paypal_order_id, paypal_order_id)
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Storage Buckets

```sql
-- Downloads bucket for digital products
INSERT INTO storage.buckets (id, name, public)
VALUES ('downloads', 'downloads', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket for seller/user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Product images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can download purchased files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'downloads'
    AND EXISTS (
        SELECT 1 FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = auth.uid()
        AND o.payment_status = 'completed'
        AND p.file_path = name
    )
);

-- Sellers can upload to their product files
CREATE POLICY "Sellers can upload product files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'downloads'
    AND auth.uid() IS NOT NULL
);

-- Anyone can view public images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('product-images', 'avatars'));

-- Users can upload avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

---

## 7. Sample Data (Optional)

```sql
-- Run AFTER a user signs up and becomes a seller
-- This is just for testing purposes
```

---

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## How to Run These Migrations

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run sections in order (1 → 6)
3. Run each section separately to catch errors
4. Verify with: `SELECT * FROM pg_policies;`

> **Important:** Run the RLS policies AFTER creating all tables.
