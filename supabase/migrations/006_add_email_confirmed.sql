-- ============================================
-- Add email_confirmed column to profiles
-- Run this in Supabase SQL Editor
-- ============================================

-- Add email_confirmed column with default false
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;

-- Update existing profiles to mark them as confirmed (since they already exist)
UPDATE public.profiles
SET email_confirmed = true
WHERE email_confirmed IS NULL OR email_confirmed = false;

-- Add index for querying by confirmation status
CREATE INDEX IF NOT EXISTS idx_profiles_email_confirmed ON public.profiles(email_confirmed);
