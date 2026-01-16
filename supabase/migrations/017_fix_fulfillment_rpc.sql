-- ============================================
-- FIX: Fulfill Order RPC - Idempotency Logic
-- ============================================
-- PREVIOUS ISSUE: The function returned early if payment_status was 'completed', 
-- skipping earnings recording even if they were missing.
--
-- FIX: We now explicitly check if seller_earnings exist.
-- If status is 'completed' but NO earnings exist, we proceed to record them.

CREATE OR REPLACE FUNCTION fulfill_order_from_webhook(
  p_order_id UUID,
  p_paypal_capture_id TEXT,
  p_escrow_days INTEGER DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_platform_fee NUMERIC;
  v_net_amount NUMERIC;
  v_release_date TIMESTAMPTZ;
  v_earnings_count INTEGER := 0;
  v_earnings_exist BOOLEAN;
BEGIN
  -- Check if already processed (idempotency)
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Check if earnings were already recorded for this order
  SELECT EXISTS(SELECT 1 FROM seller_earnings WHERE order_id = p_order_id) INTO v_earnings_exist;

  -- SMART IDEMPOTENCY CHECK:
  -- Only return early if:
  -- 1. Order is paid/completed
  -- 2. AND Earnings HAVE BEEN recorded
  -- This allows recovering "stuck" orders that are marked paid but missing earnings.
  
  IF v_order.payment_status = 'completed' AND v_earnings_exist THEN
    -- Still update capture ID if missing
    IF v_order.paypal_capture_id IS NULL AND p_paypal_capture_id IS NOT NULL THEN
      UPDATE orders SET paypal_capture_id = p_paypal_capture_id WHERE id = p_order_id;
    END IF;
    RETURN jsonb_build_object('success', true, 'message', 'Order already fully processed', 'idempotent', true);
  END IF;
  
  -- Calculate release date for escrow
  v_release_date := NOW() + (p_escrow_days || ' days')::INTERVAL;
  
  -- Update order status and capture ID
  UPDATE orders 
  SET 
    payment_status = 'completed',
    paypal_capture_id = COALESCE(paypal_capture_id, p_paypal_capture_id),
    paypal_order_id = COALESCE(paypal_order_id, 'PAYPAL-WEBHOOK-UPDATE')
  WHERE id = p_order_id;
  
  -- Process each order item and record seller earnings
  FOR v_item IN 
    SELECT oi.*, p.seller_id 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = p_order_id
  LOOP
    IF v_item.seller_id IS NOT NULL THEN
      -- Check if earnings already exist for this specific item (double safety)
      IF NOT EXISTS (SELECT 1 FROM seller_earnings WHERE order_item_id = v_item.id) THEN
          v_platform_fee := ROUND(v_item.price * 0.10, 2);
          v_net_amount := v_item.price - v_platform_fee;
          
          INSERT INTO seller_earnings (
            seller_id, order_id, order_item_id, product_id,
            gross_amount, platform_fee, net_amount, status,
            release_date, paypal_capture_id
          ) VALUES (
            v_item.seller_id, p_order_id, v_item.id, v_item.product_id,
            v_item.price, v_platform_fee, v_net_amount, 'escrow',
            v_release_date, p_paypal_capture_id
          );
          
          UPDATE sellers
          SET 
            pending_balance = COALESCE(pending_balance, 0) + v_net_amount,
            total_earnings = COALESCE(total_earnings, 0) + v_net_amount,
            updated_at = NOW()
          WHERE id = v_item.seller_id;
          
          v_earnings_count := v_earnings_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Order fulfilled successfully',
    'order_id', p_order_id,
    'earnings_recorded', v_earnings_count
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'order_id', p_order_id);
END;
$$;
