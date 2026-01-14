-- ============================================
-- Multi-Seller Marketplace Migration (IDEMPOTENT)
-- Run this AFTER the initial schema (001_initial_schema.sql)
-- ============================================

-- ============================================
-- 1. SELLERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    seller_status TEXT NOT NULL DEFAULT 'payouts_locked'
        CHECK (seller_status IN ('active', 'payouts_locked', 'suspended')),
    payout_email TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sellers_username ON public.sellers(username);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON public.sellers(seller_status);

-- ============================================
-- 2. UPDATE PRODUCTS TABLE FOR MULTI-SELLER
-- ============================================
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- Add constraint if not exists (using DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_status_check'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_status_check
      CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- ============================================
-- 3. STORE PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.store_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (seller_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_store_pages_seller ON public.store_pages(seller_id);

-- ============================================
-- 4. PAGE SECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.store_pages(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('products', 'featured', 'text', 'subscribe', 'posts')),
    title TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page ON public.page_sections(page_id);

-- ============================================
-- 5. SELLER POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.seller_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (seller_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_seller_posts_seller ON public.seller_posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_posts_status ON public.seller_posts(status);

-- ============================================
-- 6. PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'held', 'failed')),
    payout_method TEXT DEFAULT 'paypal',
    transaction_id TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_seller ON public.payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

-- ============================================
-- 7. UPDATE ORDER_ITEMS FOR SELLER TRACKING
-- ============================================
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_seller ON public.order_items(seller_id);

-- ============================================
-- 8. ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. SELLERS POLICIES (Drop and recreate for idempotency)
-- ============================================
DROP POLICY IF EXISTS "Public can view active sellers" ON public.sellers;
CREATE POLICY "Public can view active sellers"
    ON public.sellers FOR SELECT
    TO anon, authenticated
    USING (seller_status <> 'suspended');

DROP POLICY IF EXISTS "User can create own seller profile" ON public.sellers;
CREATE POLICY "User can create own seller profile"
    ON public.sellers FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Seller can update own profile" ON public.sellers;
CREATE POLICY "Seller can update own profile"
    ON public.sellers FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- ============================================
-- 10. PRODUCTS POLICIES (Update for Multi-Seller)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

DROP POLICY IF EXISTS "Seller can view own products" ON public.products;
CREATE POLICY "Seller can view own products"
    ON public.products FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can insert own products" ON public.products;
CREATE POLICY "Seller can insert own products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can update own products" ON public.products;
CREATE POLICY "Seller can update own products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can delete own products" ON public.products;
CREATE POLICY "Seller can delete own products"
    ON public.products FOR DELETE
    TO authenticated
    USING (seller_id = auth.uid());

-- ============================================
-- 11. STORE PAGES POLICIES
-- ============================================
DROP POLICY IF EXISTS "Public can view published store pages" ON public.store_pages;
CREATE POLICY "Public can view published store pages"
    ON public.store_pages FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

DROP POLICY IF EXISTS "Seller can view own pages" ON public.store_pages;
CREATE POLICY "Seller can view own pages"
    ON public.store_pages FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can insert own pages" ON public.store_pages;
CREATE POLICY "Seller can insert own pages"
    ON public.store_pages FOR INSERT
    TO authenticated
    WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can update own pages" ON public.store_pages;
CREATE POLICY "Seller can update own pages"
    ON public.store_pages FOR UPDATE
    TO authenticated
    USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can delete own pages" ON public.store_pages;
CREATE POLICY "Seller can delete own pages"
    ON public.store_pages FOR DELETE
    TO authenticated
    USING (seller_id = auth.uid());

-- ============================================
-- 12. PAGE SECTIONS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Public can view sections of published pages" ON public.page_sections;
CREATE POLICY "Public can view sections of published pages"
    ON public.page_sections FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.store_pages sp
            WHERE sp.id = page_sections.page_id
            AND sp.is_published = true
        )
    );

DROP POLICY IF EXISTS "Seller can manage own sections" ON public.page_sections;
CREATE POLICY "Seller can manage own sections"
    ON public.page_sections FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.store_pages sp
            WHERE sp.id = page_sections.page_id
            AND sp.seller_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.store_pages sp
            WHERE sp.id = page_sections.page_id
            AND sp.seller_id = auth.uid()
        )
    );

-- ============================================
-- 13. SELLER POSTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Public can view published posts" ON public.seller_posts;
CREATE POLICY "Public can view published posts"
    ON public.seller_posts FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

DROP POLICY IF EXISTS "Seller can view own posts" ON public.seller_posts;
CREATE POLICY "Seller can view own posts"
    ON public.seller_posts FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can insert own posts" ON public.seller_posts;
CREATE POLICY "Seller can insert own posts"
    ON public.seller_posts FOR INSERT
    TO authenticated
    WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can update own posts" ON public.seller_posts;
CREATE POLICY "Seller can update own posts"
    ON public.seller_posts FOR UPDATE
    TO authenticated
    USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Seller can delete own posts" ON public.seller_posts;
CREATE POLICY "Seller can delete own posts"
    ON public.seller_posts FOR DELETE
    TO authenticated
    USING (seller_id = auth.uid());

-- ============================================
-- 14. PAYOUTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Seller can view own payouts" ON public.payouts;
CREATE POLICY "Seller can view own payouts"
    ON public.payouts FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());

-- ============================================
-- 15. ORDERS POLICIES (Secure - Remove Client Update)
-- ============================================
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

DROP POLICY IF EXISTS "Sellers can view orders with their products" ON public.orders;
CREATE POLICY "Sellers can view orders with their products"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.order_items oi
            WHERE oi.order_id = orders.id
            AND oi.seller_id = auth.uid()
        )
    );

-- ============================================
-- 16. ORDER ITEMS POLICIES (Seller View)
-- ============================================
DROP POLICY IF EXISTS "Sellers can view their order items" ON public.order_items;
CREATE POLICY "Sellers can view their order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (seller_id = auth.uid());

-- ============================================
-- 17. STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
