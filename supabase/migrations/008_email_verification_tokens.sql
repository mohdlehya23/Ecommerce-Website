-- ============================================
-- Email Verification Tokens Table
-- ============================================

-- Table to store email verification tokens
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON public.email_verification_tokens(user_id);

-- Add rate limiting column to profiles (tracks last verification email sent)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_verification_sent_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own tokens (for debugging, optional)
CREATE POLICY "Users can view own tokens"
    ON public.email_verification_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can do everything (for API endpoints)
CREATE POLICY "Service role full access"
    ON public.email_verification_tokens
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to clean up expired tokens (optional, run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM public.email_verification_tokens
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
