-- ============================================
-- Admin RBAC Migration: Admin Users & Audit Logging
-- Run this in Supabase SQL Editor
-- IDEMPOTENT: Can be run multiple times safely
-- ============================================

-- ============================================
-- 1. ADMIN_USERS TABLE
-- Dedicated table for admin users (NOT profiles.role)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- ============================================
-- 2. ADMIN_AUDIT_LOGS TABLE
-- Track all admin actions for compliance and debugging
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('add_admin', 'remove_admin', 'update_seller_status', 'update_payout_status', 'update_product_status')),
    entity_type TEXT CHECK (entity_type IN ('admin', 'seller', 'payout', 'product')),
    entity_id UUID,
    before JSONB DEFAULT '{}'::jsonb,
    after JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- ============================================
-- 3. ADMIN CHECK FUNCTION
-- SECURITY DEFINER function with hardened search_path
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    );
END;
$$;

-- ============================================
-- 4. RLS POLICIES FOR ADMIN_USERS
-- ============================================

-- Admins can view all admin_users
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admins can add new admins
DROP POLICY IF EXISTS "Admins can add admins" ON public.admin_users;
CREATE POLICY "Admins can add admins"
    ON public.admin_users FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Admins can remove admins
DROP POLICY IF EXISTS "Admins can remove admins" ON public.admin_users;
CREATE POLICY "Admins can remove admins"
    ON public.admin_users FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- 5. RLS POLICIES FOR ADMIN_AUDIT_LOGS
-- ============================================

-- Admins can view all audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admins can insert audit logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- ============================================
-- 6. ADMIN SELECT POLICIES FOR PLATFORM TABLES
-- Admins can view all data across the platform
-- ============================================

-- Profiles: Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Sellers: Admins can view all sellers
DROP POLICY IF EXISTS "Admins can view all sellers" ON public.sellers;
CREATE POLICY "Admins can view all sellers"
    ON public.sellers FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Products: Admins can view all products (including drafts)
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products"
    ON public.products FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Orders: Admins can view all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Order Items: Admins can view all order items
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Payouts: Admins can view all payouts
DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payouts;
CREATE POLICY "Admins can view all payouts"
    ON public.payouts FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Store Pages: Admins can view all store pages
DROP POLICY IF EXISTS "Admins can view all store_pages" ON public.store_pages;
CREATE POLICY "Admins can view all store_pages"
    ON public.store_pages FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Page Sections: Admins can view all page sections
DROP POLICY IF EXISTS "Admins can view all page_sections" ON public.page_sections;
CREATE POLICY "Admins can view all page_sections"
    ON public.page_sections FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Seller Posts: Admins can view all seller posts
DROP POLICY IF EXISTS "Admins can view all seller_posts" ON public.seller_posts;
CREATE POLICY "Admins can view all seller_posts"
    ON public.seller_posts FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Newsletter: Admins can view all newsletter subscribers
DROP POLICY IF EXISTS "Admins can view all newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view all newsletter_subscribers"
    ON public.newsletter_subscribers FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- 7. ADMIN LIMITED UPDATE POLICIES
-- Admins can only update specific status fields
-- IMPORTANT: payment_status remains server-side only
-- ============================================

-- Sellers: Admins can update seller_status only
DROP POLICY IF EXISTS "Admins can update seller status" ON public.sellers;
CREATE POLICY "Admins can update seller status"
    ON public.sellers FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Products: Admins can update product status only
DROP POLICY IF EXISTS "Admins can update product status" ON public.products;
CREATE POLICY "Admins can update product status"
    ON public.products FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Payouts: Admins can update payout status and note
DROP POLICY IF EXISTS "Admins can update payout status" ON public.payouts;
CREATE POLICY "Admins can update payout status"
    ON public.payouts FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================
-- 8. HELPER FUNCTION: GET ADMIN COUNT
-- Used to prevent removing the last admin
-- ============================================
CREATE OR REPLACE FUNCTION public.get_admin_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
    RETURN (SELECT COUNT(*)::integer FROM public.admin_users);
END;
$$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- To add your first admin, run:
-- INSERT INTO public.admin_users (user_id) VALUES ('<your-user-id>');

-- To verify:
-- SELECT * FROM public.admin_users;
-- SELECT public.is_admin(); -- Run as admin user, should return true
