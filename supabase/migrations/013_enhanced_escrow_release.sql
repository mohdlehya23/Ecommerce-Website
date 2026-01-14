-- ============================================
-- ENHANCED ESCROW RELEASE SYSTEM MIGRATION
-- Implements atomic, idempotent escrow release
-- with comprehensive logging and DECIMAL precision
-- ============================================

-- ============================================
-- 1. ESCROW RELEASE LOG TABLE
-- Track all escrow releases for audit and debugging
-- ============================================
CREATE TABLE IF NOT EXISTS escrow_release_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  records_processed INTEGER NOT NULL DEFAULT 0,
  total_amount_released DECIMAL(10,2) NOT NULL DEFAULT 0,
  seller_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'failed', 'partial'
  error_message TEXT,
  execution_time_ms INTEGER,
  details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_escrow_release_logs_run_at 
ON escrow_release_logs(run_at DESC);

-- ============================================
-- 2. ENHANCED RELEASE_MATURED_ESCROW RPC
-- Atomic transaction with detailed logging
-- ============================================
CREATE OR REPLACE FUNCTION release_matured_escrow()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time TIMESTAMPTZ := NOW();
  v_earning RECORD;
  v_records_processed INTEGER := 0;
  v_total_amount DECIMAL(10,2) := 0;
  v_sellers_updated UUID[] := '{}';
  v_log_id UUID;
  v_error_message TEXT;
BEGIN
  -- Create log entry first
  INSERT INTO escrow_release_logs (status) 
  VALUES ('processing')
  RETURNING id INTO v_log_id;

  BEGIN
    -- Process each matured escrow record
    -- Using release_date (set to created_at + 14 days during insertion)
    FOR v_earning IN 
      SELECT 
        id, 
        seller_id, 
        net_amount,
        order_id
      FROM seller_earnings 
      WHERE status = 'escrow' 
        AND release_date <= NOW()
        AND released_at IS NULL  -- Idempotency: only process unreleased
      FOR UPDATE SKIP LOCKED  -- Prevent race conditions
    LOOP
      -- Update the earning record to 'available'
      UPDATE seller_earnings
      SET 
        status = 'available',
        released_at = NOW()
      WHERE id = v_earning.id
        AND status = 'escrow'  -- Double-check for safety
        AND released_at IS NULL;
      
      -- Only proceed if row was actually updated (idempotency)
      IF FOUND THEN
        -- Transfer from pending_balance to available_balance
        UPDATE sellers
        SET 
          pending_balance = GREATEST(COALESCE(pending_balance, 0) - v_earning.net_amount, 0),
          available_balance = COALESCE(available_balance, 0) + v_earning.net_amount,
          updated_at = NOW()
        WHERE id = v_earning.seller_id;
        
        -- Track stats
        v_records_processed := v_records_processed + 1;
        v_total_amount := v_total_amount + v_earning.net_amount;
        
        -- Track unique sellers
        IF NOT v_earning.seller_id = ANY(v_sellers_updated) THEN
          v_sellers_updated := array_append(v_sellers_updated, v_earning.seller_id);
        END IF;
      END IF;
    END LOOP;

    -- Update log with success details
    UPDATE escrow_release_logs
    SET 
      status = 'completed',
      records_processed = v_records_processed,
      total_amount_released = v_total_amount,
      seller_count = array_length(v_sellers_updated, 1),
      execution_time_ms = EXTRACT(MILLISECONDS FROM (NOW() - v_start_time))::INTEGER,
      details = jsonb_build_object(
        'seller_ids', to_jsonb(v_sellers_updated),
        'completed_at', NOW()
      )
    WHERE id = v_log_id;

    RETURN jsonb_build_object(
      'success', true,
      'records_processed', v_records_processed,
      'total_amount_released', v_total_amount,
      'seller_count', COALESCE(array_length(v_sellers_updated, 1), 0),
      'execution_time_ms', EXTRACT(MILLISECONDS FROM (NOW() - v_start_time))::INTEGER,
      'log_id', v_log_id
    );

  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    
    -- Update log with error
    UPDATE escrow_release_logs
    SET 
      status = 'failed',
      error_message = v_error_message,
      records_processed = v_records_processed,
      total_amount_released = v_total_amount,
      execution_time_ms = EXTRACT(MILLISECONDS FROM (NOW() - v_start_time))::INTEGER
    WHERE id = v_log_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', v_error_message,
      'records_processed', v_records_processed,
      'log_id', v_log_id
    );
  END;
END;
$$;

-- ============================================
-- 3. DROP OLD FUNCTION IF EXISTS
-- Replace the simpler version from migration 010
-- ============================================
DROP FUNCTION IF EXISTS release_escrow_funds();

-- Create alias for backward compatibility
CREATE OR REPLACE FUNCTION release_escrow_funds()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT release_matured_escrow();
$$;

-- ============================================
-- 4. RLS FOR ESCROW RELEASE LOGS
-- ============================================
ALTER TABLE escrow_release_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view escrow release logs" ON escrow_release_logs;
CREATE POLICY "Admins can view escrow release logs"
  ON escrow_release_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
