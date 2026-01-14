import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// POST /api/paypal/checkout-webhook
// Handles PayPal Checkout webhook events (PAYMENT.CAPTURE.COMPLETED)
// Implements signature verification, idempotency, and atomic transactions

export async function POST(request: Request) {
  const adminClient = createAdminClient();
  let webhookBody: any;
  let rawBody: string;

  try {
    // ========================================
    // 1. PARSE AND LOG RAW BODY
    // ========================================
    rawBody = await request.text();
    webhookBody = JSON.parse(rawBody);

    const eventType = webhookBody.event_type;
    const resourceId = webhookBody.resource?.id || webhookBody.id;

    console.log("[CHECKOUT WEBHOOK] Event received:", eventType);
    console.log("[CHECKOUT WEBHOOK] Resource ID:", resourceId);

    // ========================================
    // 2. VERIFY PAYPAL SIGNATURE
    // ========================================
    const isVerified = await verifyPayPalSignature(request, rawBody);

    if (!isVerified) {
      console.error("[CHECKOUT WEBHOOK] Signature verification failed");

      // Log failed verification attempt
      await adminClient.from("webhook_logs").insert({
        webhook_type: "paypal_checkout",
        event_type: eventType || "UNKNOWN",
        resource_id: resourceId,
        payload: webhookBody,
        processed: false,
        error_message: "Signature verification failed",
      });

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ========================================
    // 3. HANDLE EVENTS
    // ========================================
    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        const result = await handleCaptureCompleted(webhookBody, adminClient);

        // Log successful processing
        await adminClient.from("webhook_logs").insert({
          webhook_type: "paypal_checkout",
          event_type: eventType,
          resource_id: resourceId,
          payload: webhookBody,
          processed: true,
          error_message: result.success ? null : result.error,
        });

        return NextResponse.json(result);
      }

      case "CHECKOUT.ORDER.APPROVED": {
        // Order approved but not yet captured - just log it
        console.log("[CHECKOUT WEBHOOK] Order approved:", resourceId);

        await adminClient.from("webhook_logs").insert({
          webhook_type: "paypal_checkout",
          event_type: eventType,
          resource_id: resourceId,
          payload: webhookBody,
          processed: true,
        });

        return NextResponse.json({ received: true, event: eventType });
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED": {
        console.log("[CHECKOUT WEBHOOK] Payment failed/refunded:", resourceId);

        // Update order status if exists
        const captureId = webhookBody.resource?.id;
        if (captureId) {
          await adminClient
            .from("orders")
            .update({
              status:
                eventType === "PAYMENT.CAPTURE.REFUNDED"
                  ? "refunded"
                  : "failed",
            })
            .eq("paypal_capture_id", captureId);
        }

        await adminClient.from("webhook_logs").insert({
          webhook_type: "paypal_checkout",
          event_type: eventType,
          resource_id: resourceId,
          payload: webhookBody,
          processed: true,
        });

        return NextResponse.json({ received: true, event: eventType });
      }

      default: {
        // Log unhandled events for debugging
        console.log("[CHECKOUT WEBHOOK] Unhandled event:", eventType);

        await adminClient.from("webhook_logs").insert({
          webhook_type: "paypal_checkout",
          event_type: eventType || "UNKNOWN",
          resource_id: resourceId,
          payload: webhookBody,
          processed: false,
          error_message: "Unhandled event type",
        });

        return NextResponse.json({ received: true, event: eventType });
      }
    }
  } catch (error) {
    console.error("[CHECKOUT WEBHOOK] Error:", error);

    // Try to log the error
    try {
      await adminClient.from("webhook_logs").insert({
        webhook_type: "paypal_checkout",
        event_type: webhookBody?.event_type || "PARSE_ERROR",
        resource_id: webhookBody?.resource?.id || null,
        payload: webhookBody || { raw: rawBody?.substring(0, 1000) },
        processed: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
    } catch {
      // Ignore logging errors
    }

    // Return 200 to acknowledge receipt (prevent PayPal retries on our errors)
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}

// ========================================
// PAYPAL SIGNATURE VERIFICATION
// ========================================
async function verifyPayPalSignature(
  request: Request,
  rawBody: string
): Promise<boolean> {
  try {
    const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_CHECKOUT_WEBHOOK_ID;

    // Skip verification in development if no webhook ID configured
    if (!PAYPAL_WEBHOOK_ID) {
      console.warn(
        "[CHECKOUT WEBHOOK] No PAYPAL_CHECKOUT_WEBHOOK_ID - skipping verification"
      );
      return process.env.NODE_ENV !== "production"; // Only skip in dev
    }

    // Get PayPal signature headers
    const transmissionId = request.headers.get("paypal-transmission-id");
    const timestamp = request.headers.get("paypal-transmission-time");
    const signature = request.headers.get("paypal-transmission-sig");
    const certUrl = request.headers.get("paypal-cert-url");
    const authAlgo = request.headers.get("paypal-auth-algo");

    if (!transmissionId || !timestamp || !signature || !certUrl) {
      console.error("[CHECKOUT WEBHOOK] Missing signature headers");
      return false;
    }

    // For production, verify with PayPal API
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
    const PAYPAL_API_URL =
      process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      console.error(
        "[CHECKOUT WEBHOOK] Missing PayPal credentials for verification"
      );
      return false;
    }

    // Get access token
    const authResponse = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      console.error(
        "[CHECKOUT WEBHOOK] Failed to get PayPal token for verification"
      );
      return false;
    }

    const { access_token } = await authResponse.json();

    // Verify signature with PayPal
    const verifyResponse = await fetch(
      `${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: signature,
          transmission_time: timestamp,
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(rawBody),
        }),
      }
    );

    const verifyResult = await verifyResponse.json();
    const isValid = verifyResult.verification_status === "SUCCESS";

    if (!isValid) {
      console.error("[CHECKOUT WEBHOOK] Verification failed:", verifyResult);
    }

    return isValid;
  } catch (error) {
    console.error("[CHECKOUT WEBHOOK] Signature verification error:", error);
    return false;
  }
}

// ========================================
// HANDLE PAYMENT.CAPTURE.COMPLETED
// ========================================
async function handleCaptureCompleted(
  webhookBody: any,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  idempotent?: boolean;
}> {
  try {
    const capture = webhookBody.resource;
    const captureId = capture?.id;
    const customId = capture?.custom_id; // This should be our order ID

    if (!captureId) {
      return { success: false, error: "Missing capture ID" };
    }

    console.log("[CHECKOUT WEBHOOK] Processing capture:", captureId);
    console.log("[CHECKOUT WEBHOOK] Custom ID (Order ID):", customId);

    // ========================================
    // IDEMPOTENCY CHECK
    // ========================================
    const { data: existingOrder } = await adminClient
      .from("orders")
      .select("id, status, paypal_capture_id")
      .eq("paypal_capture_id", captureId)
      .single();

    if (existingOrder) {
      console.log("[CHECKOUT WEBHOOK] Already processed capture:", captureId);
      return { success: true, message: "Already processed", idempotent: true };
    }

    // ========================================
    // FIND ORDER BY CUSTOM_ID OR PAYPAL ORDER ID
    // ========================================
    let orderId = customId;

    // If custom_id is not set, try to find by PayPal order ID in supplementary_data
    if (!orderId) {
      const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;

      if (paypalOrderId) {
        const { data: orderByPaypalId } = await adminClient
          .from("orders")
          .select("id")
          .eq("paypal_order_id", paypalOrderId)
          .single();

        orderId = orderByPaypalId?.id;
      }
    }

    if (!orderId) {
      console.error(
        "[CHECKOUT WEBHOOK] Could not find order for capture:",
        captureId
      );
      return { success: false, error: "Order not found for this capture" };
    }

    // ========================================
    // CALL ATOMIC FULFILLMENT RPC
    // ========================================
    const { data: result, error: rpcError } = await adminClient.rpc(
      "fulfill_order_from_webhook",
      {
        p_order_id: orderId,
        p_paypal_capture_id: captureId,
        p_escrow_days: 14,
      }
    );

    if (rpcError) {
      console.error("[CHECKOUT WEBHOOK] RPC error:", rpcError);
      return { success: false, error: rpcError.message };
    }

    console.log("[CHECKOUT WEBHOOK] Fulfillment result:", result);

    // The RPC returns a JSONB object
    if (result && typeof result === "object") {
      return {
        success: result.success,
        message: result.message,
        error: result.error,
        idempotent: result.idempotent,
      };
    }

    return { success: true, message: "Order fulfilled" };
  } catch (error) {
    console.error("[CHECKOUT WEBHOOK] Handle capture error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    status: "PayPal Checkout Webhook endpoint active",
    path: "/api/paypal/checkout-webhook",
  });
}
