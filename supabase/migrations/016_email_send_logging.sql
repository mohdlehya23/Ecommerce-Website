-- =====================================================
-- Migration 016: Email Send Logging System
-- =====================================================
-- Adds email tracking for improved deliverability:
-- 1. email_send_logs table for tracking all sent emails
-- 2. Email templates table for consistent messaging
-- 3. Retry mechanism support
-- =====================================================

-- =====================================================
-- 1. CREATE EMAIL_SEND_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_send_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Email details
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT, -- e.g., 'order_receipt', 'verification', 'payout_notification'
  
  -- Reference data (for linking to orders, users, etc.)
  reference_type TEXT, -- e.g., 'order', 'user', 'payout'
  reference_id UUID,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  
  -- Provider info (for debugging)
  provider TEXT, -- e.g., 'supabase', 'resend', 'sendgrid'
  provider_message_id TEXT,
  
  -- Retry tracking
  attempt_count INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_send_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_send_logs(template);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_send_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_reference ON email_send_logs(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_send_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_pending_retry ON email_send_logs(status, next_retry_at) 
  WHERE status = 'pending' AND next_retry_at IS NOT NULL;

-- Enable RLS
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on email_send_logs"
  ON email_send_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view logs
CREATE POLICY "Admins can view email logs"
  ON email_send_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- =====================================================
-- 2. CREATE EMAIL TEMPLATES TABLE (Optional)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY, -- e.g., 'order_receipt', 'verification'
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB, -- Describes available variables like {order_id, buyer_name, etc.}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO email_templates (id, name, subject, body_html, body_text, variables) VALUES
(
  'order_receipt',
  'Order Receipt',
  'Your receipt for Order #{{order_short_id}}',
  '<h1>Thank you for your purchase!</h1><p>Your order #{{order_short_id}} has been confirmed.</p><p><a href="{{receipt_url}}">View Receipt</a></p>',
  'Thank you for your purchase! Your order #{{order_short_id}} has been confirmed. View your receipt: {{receipt_url}}',
  '["order_short_id", "buyer_name", "total_amount", "receipt_url", "items"]'::jsonb
),
(
  'verification',
  'Email Verification',
  'Verify your email address',
  '<h1>Verify your email</h1><p>Click the link below to verify your email address:</p><p><a href="{{verification_url}}">Verify Email</a></p>',
  'Verify your email by clicking: {{verification_url}}',
  '["verification_url", "user_name"]'::jsonb
),
(
  'payout_notification',
  'Payout Processed',
  'Your payout of ${{amount}} has been processed',
  '<h1>Payout Processed</h1><p>Your payout of ${{amount}} has been sent to your PayPal account ({{paypal_email}}).</p>',
  'Your payout of ${{amount}} has been sent to your PayPal account ({{paypal_email}}).',
  '["amount", "paypal_email", "payout_id"]'::jsonb
),
(
  'seller_sale',
  'New Sale Notification',
  'You made a sale! 🎉',
  '<h1>Congratulations!</h1><p>You just sold "{{product_title}}" for ${{amount}}.</p><p>After the 14-day escrow period, you''ll receive ${{seller_amount}} (90%).</p>',
  'You just sold "{{product_title}}" for ${{amount}}. After escrow, you''ll receive ${{seller_amount}}.',
  '["product_title", "amount", "seller_amount", "buyer_name"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- RLS for templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active templates"
  ON email_templates FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage templates"
  ON email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- =====================================================
-- 3. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to log email send attempt
CREATE OR REPLACE FUNCTION log_email_send(
  p_recipient TEXT,
  p_subject TEXT,
  p_template TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_provider TEXT DEFAULT 'supabase'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO email_send_logs (
    recipient, subject, template, reference_type, reference_id, provider, status
  ) VALUES (
    p_recipient, p_subject, p_template, p_reference_type, p_reference_id, p_provider, 'pending'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_log_id UUID,
  p_provider_message_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE email_send_logs
  SET 
    status = 'sent',
    sent_at = NOW(),
    provider_message_id = p_provider_message_id,
    updated_at = NOW()
  WHERE id = p_log_id;
END;
$$;

-- Function to mark email as failed
CREATE OR REPLACE FUNCTION mark_email_failed(
  p_log_id UUID,
  p_error_message TEXT,
  p_retry BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_attempts INTEGER;
  v_max_attempts INTEGER;
BEGIN
  SELECT attempt_count, max_attempts 
  INTO v_current_attempts, v_max_attempts
  FROM email_send_logs WHERE id = p_log_id;
  
  IF p_retry AND v_current_attempts < v_max_attempts THEN
    -- Schedule retry with exponential backoff
    UPDATE email_send_logs
    SET 
      status = 'pending',
      error_message = p_error_message,
      attempt_count = v_current_attempts + 1,
      next_retry_at = NOW() + (INTERVAL '1 minute' * POWER(2, v_current_attempts)),
      updated_at = NOW()
    WHERE id = p_log_id;
  ELSE
    -- Mark as permanently failed
    UPDATE email_send_logs
    SET 
      status = 'failed',
      error_message = p_error_message,
      updated_at = NOW()
    WHERE id = p_log_id;
  END IF;
END;
$$;

-- Function to get emails pending retry
CREATE OR REPLACE FUNCTION get_pending_retry_emails()
RETURNS TABLE (
  id UUID,
  recipient TEXT,
  subject TEXT,
  template TEXT,
  reference_type TEXT,
  reference_id UUID,
  attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id, l.recipient, l.subject, l.template, 
    l.reference_type, l.reference_id, l.attempt_count
  FROM email_send_logs l
  WHERE l.status = 'pending' 
    AND l.next_retry_at IS NOT NULL 
    AND l.next_retry_at <= NOW()
  ORDER BY l.created_at
  LIMIT 50;
END;
$$;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION log_email_send TO service_role;
GRANT EXECUTE ON FUNCTION mark_email_sent TO service_role;
GRANT EXECUTE ON FUNCTION mark_email_failed TO service_role;
GRANT EXECUTE ON FUNCTION get_pending_retry_emails TO service_role;

-- =====================================================
-- 5. CREATE EMAIL STATS VIEW FOR ADMIN
-- =====================================================
CREATE OR REPLACE VIEW email_stats AS
SELECT 
  template,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) AS total_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('sent', 'failed')), 0) * 100, 
    2
  ) AS success_rate,
  MAX(created_at) AS last_sent
FROM email_send_logs
GROUP BY template
ORDER BY total_count DESC;

GRANT SELECT ON email_stats TO authenticated;

COMMENT ON VIEW email_stats IS 'Email delivery statistics by template';
