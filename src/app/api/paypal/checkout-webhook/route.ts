import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewSaleEmail, sendOrderReceiptEmail } from "@/lib/email";
import crypto from "crypto";

// POST /api/paypal/checkout-webhook
// Handles PayPal Checkout webhook events (PAYMENT.CAPTURE.COMPLETED)
// Implements signature verification, idempotency, and atomic transactions

export async function POST(request: Request) {
  const adminClient = createAdminClient();
  let webhookBody: any;
  let rawBody: string = "";

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

      case "PAYMENT.CAPTURE.PENDING": {
        // Payment is pending (e.g., eCheck, risk review)
        console.log("[CHECKOUT WEBHOOK] Payment pending:", resourceId);

        const captureId = webhookBody.resource?.id;
        if (captureId) {
          await adminClient
            .from("orders")
            .update({ payment_status: "pending" })
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

      case "PAYMENT.CAPTURE.DENIED": {
        console.log("[CHECKOUT WEBHOOK] Payment denied:", resourceId);

        const captureId = webhookBody.resource?.id;
        if (captureId) {
          await adminClient
            .from("orders")
            .update({ payment_status: "failed" })
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

      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        // CRITICAL: Handle refunds and reversals
        // Must revoke access and reverse seller earnings
        console.log(
          "[CHECKOUT WEBHOOK] Payment refunded/reversed:",
          resourceId
        );

        const result = await handleRefundOrReversal(
          webhookBody,
          eventType,
          adminClient
        );

        await adminClient.from("webhook_logs").insert({
          webhook_type: "paypal_checkout",
          event_type: eventType,
          resource_id: resourceId,
          payload: webhookBody,
          processed: result.success,
          error_message: result.error || null,
        });

        return NextResponse.json(result);
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

    // ========================================
    // SEND EMAIL NOTIFICATIONS
    // ========================================
    if (result?.success && !result?.idempotent) {
      try {
        // Fetch order with items and seller info for email
        const { data: orderData } = await adminClient
          .from("orders")
          .select(
            `
            id,
            buyer_email,
            buyer_name,
            total_amount,
            receipt_token,
            order_items (
              price,
              product_id,
              product:products (
                title,
                seller_id,
                seller:sellers (
                  id,
                  user_id,
                  profile:profiles (
                    full_name,
                    email
                  )
                )
              )
            )
          `
          )
          .eq("id", orderId)
          .single();

        if (orderData) {
          const baseUrl =
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
          const orderShortId = orderId.slice(0, 8).toUpperCase();

          // 1. Send receipt to buyer
          const receiptUrl = orderData.receipt_token
            ? `${baseUrl}/purchases/${orderData.receipt_token}`
            : `${baseUrl}/dashboard/purchases/${orderId}`;

          const items = (orderData.order_items || []).map((item: any) => ({
            title: item.product?.title || "Product",
            price: item.price || 0,
          }));

          await sendOrderReceiptEmail({
            orderId,
            buyerEmail: orderData.buyer_email || "",
            buyerName: orderData.buyer_name || "Customer",
            orderShortId,
            totalAmount: orderData.total_amount || 0,
            receiptUrl,
            items,
          });
          console.log(
            "[CHECKOUT WEBHOOK] Receipt email sent to:",
            orderData.buyer_email
          );

          // 2. Send sale notification to each seller
          const sellersNotified = new Set<string>();

          for (const item of orderData.order_items || []) {
            const product = item.product as any;
            const seller = product?.seller as any;
            const profile = seller?.profile;

            if (seller?.id && !sellersNotified.has(seller.id)) {
              sellersNotified.add(seller.id);

              const sellerEmail = profile?.email;
              const sellerName = profile?.full_name || "Seller";
              const saleAmount = item.price || 0;
              const sellerEarnings = saleAmount * 0.9; // 90% after platform fee

              if (sellerEmail) {
                await sendNewSaleEmail({
                  sellerId: seller.id,
                  sellerEmail,
                  sellerName,
                  productTitle: product.title || "Product",
                  saleAmount,
                  sellerEarnings,
                  buyerName: orderData.buyer_name || "Customer",
                });
                console.log(
                  "[CHECKOUT WEBHOOK] Sale notification sent to:",
                  sellerEmail
                );
              }
            }
          }
        }
      } catch (emailError) {
        // Don't fail the order if email fails
        console.error(
          "[CHECKOUT WEBHOOK] Email notification error:",
          emailError
        );
      }
    }

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

// ========================================
// HANDLE REFUND OR REVERSAL
// ========================================
async function handleRefundOrReversal(
  webhookBody: any,
  eventType: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const capture = webhookBody.resource;
    const captureId = capture?.id;

    if (!captureId) {
      return { success: false, error: "Missing capture ID" };
    }

    console.log(
      "[CHECKOUT WEBHOOK] Processing refund/reversal for capture:",
      captureId
    );

    // Determine the new status
    const newStatus =
      eventType === "PAYMENT.CAPTURE.REFUNDED" ? "refunded" : "reversed";

    // ========================================
    // 1. FIND THE ORDER BY CAPTURE ID
    // ========================================
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id, payment_status, total_amount, receipt_token")
      .eq("paypal_capture_id", captureId)
      .single();

    if (orderError || !order) {
      console.error(
        "[CHECKOUT WEBHOOK] Order not found for capture:",
        captureId
      );
      return { success: false, error: "Order not found for this capture" };
    }

    // Check if already processed
    if (
      order.payment_status === "refunded" ||
      order.payment_status === "reversed"
    ) {
      console.log("[CHECKOUT WEBHOOK] Already refunded/reversed:", order.id);
      return { success: true, message: "Already processed" };
    }

    console.log(
      "[CHECKOUT WEBHOOK] Found order:",
      order.id,
      "Current status:",
      order.payment_status
    );

    // ========================================
    // 2. UPDATE ORDER PAYMENT STATUS
    // ========================================
    const { error: updateOrderError } = await adminClient
      .from("orders")
      .update({
        payment_status: newStatus,
        // Invalidate receipt token to prevent downloads
        receipt_token: null,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateOrderError) {
      console.error(
        "[CHECKOUT WEBHOOK] Failed to update order:",
        updateOrderError
      );
      return { success: false, error: "Failed to update order status" };
    }

    console.log("[CHECKOUT WEBHOOK] Updated order status to:", newStatus);

    // ========================================
    // 3. REVERSE SELLER EARNINGS
    // ========================================
    // Get all earnings for this order
    const { data: earnings, error: earningsError } = await adminClient
      .from("seller_earnings")
      .select("id, seller_id, net_amount, status")
      .eq("order_id", order.id);

    if (earningsError) {
      console.error(
        "[CHECKOUT WEBHOOK] Failed to fetch earnings:",
        earningsError
      );
    }

    if (earnings && earnings.length > 0) {
      console.log(
        "[CHECKOUT WEBHOOK] Found",
        earnings.length,
        "earning records to reverse"
      );

      for (const earning of earnings) {
        // Mark earning as refunded
        await adminClient
          .from("seller_earnings")
          .update({
            status: "refunded",
            refunded_at: new Date().toISOString(),
          })
          .eq("id", earning.id);

        // Deduct from seller's balance based on earning status
        if (earning.status === "released" || earning.status === "available") {
          // Already released to available balance - deduct from available
          await adminClient.rpc("decrement_seller_available_balance", {
            p_seller_id: earning.seller_id,
            p_amount: earning.net_amount,
          });
          console.log(
            "[CHECKOUT WEBHOOK] Deducted from available balance:",
            earning.net_amount
          );
        } else if (
          earning.status === "pending" ||
          earning.status === "escrow"
        ) {
          // Still in escrow - deduct from pending balance
          await adminClient.rpc("decrement_seller_pending_balance", {
            p_seller_id: earning.seller_id,
            p_amount: earning.net_amount,
          });
          console.log(
            "[CHECKOUT WEBHOOK] Deducted from pending balance:",
            earning.net_amount
          );
        }

        // Also deduct from total earnings
        await adminClient.rpc("decrement_seller_total_earnings", {
          p_seller_id: earning.seller_id,
          p_amount: earning.net_amount,
        });
      }
    }

    // ========================================
    // 4. LOG THE REFUND EVENT
    // ========================================
    console.log(
      "[CHECKOUT WEBHOOK] Refund/reversal processed successfully for order:",
      order.id
    );

    return {
      success: true,
      message: `Order ${order.id} marked as ${newStatus}. ${
        earnings?.length || 0
      } seller earnings reversed.`,
    };
  } catch (error) {
    console.error("[CHECKOUT WEBHOOK] Handle refund error:", error);
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
