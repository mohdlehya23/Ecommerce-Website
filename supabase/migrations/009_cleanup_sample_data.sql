-- Cleanup: Remove sample products that were created in migration 001
-- This migration removes demo/fake data to prepare for production

-- Remove sample products by their known slugs
DELETE FROM products WHERE slug IN (
  'complete-business-strategy-guide',
  'professional-dashboard-template',
  'strategy-consultation-1h',
  'marketing-automation-playbook',
  'startup-essentials-pack'
);

-- ============================================
-- FIX CATEGORY CONSTRAINT (case-insensitive)
-- ============================================
-- First, normalize existing data to lowercase
UPDATE products SET category = LOWER(category) WHERE category IS NOT NULL;

-- Drop and recreate the constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
-- Note: Constraint is now handled by the form sending lowercase values

-- ============================================
-- FIX PRODUCT_TYPE CONSTRAINT (case-insensitive)  
-- ============================================
-- Normalize existing data to lowercase
UPDATE products SET product_type = LOWER(product_type) WHERE product_type IS NOT NULL;

-- Drop and recreate the constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
