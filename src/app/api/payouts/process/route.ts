import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/payouts/process
// Admin processes a payout request via PayPal Payouts API
// IMPORTANT: This route sets status to "processing", NOT "completed"
// The webhook handler will set status to "completed" when PayPal confirms

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // ========================================
    // 1. CREDENTIAL VERIFICATION (Early Fail)
    // ========================================
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
    const PAYPAL_API_URL =
      process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      console.error("[PAYOUT] Missing PayPal credentials:", {
        hasClientId: !!PAYPAL_CLIENT_ID,
        hasSecret: !!PAYPAL_SECRET,
      });
      return NextResponse.json(
        {
          error: "PayPal credentials not configured",
          details:
            "Please set PAYPAL_CLIENT_ID and PAYPAL_SECRET in your .env.local file",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 2. ADMIN AUTHENTICATION
    // ========================================
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // ========================================
    // 3. GET PAYOUT REQUEST (pending or failed)
    // ========================================
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Allow pending or failed (for retry)
    const { data: payoutRequest, error: fetchError } = await adminClient
      .from("payout_requests")
      .select(
        `
        *,
        seller:sellers(display_name, username, payout_paypal_email, payout_email)
      `
      )
      .eq("id", requestId)
      .in("status", ["pending", "failed"])
      .single();

    if (fetchError || !payoutRequest) {
      return NextResponse.json(
        { error: "Payout request not found or already processed" },
        { status: 404 }
      );
    }

    // ========================================
    // 4. MARK AS PROCESSING (Before PayPal call)
    // ========================================
    const { error: updateError } = await adminClient
      .from("payout_requests")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
        failure_reason: null, // Clear previous failure reason if retrying
      })
      .eq("id", requestId);

    if (updateError) {
      console.error(
        "[PAYOUT] Failed to update status to processing:",
        updateError
      );
      return NextResponse.json(
        { error: "Failed to update payout status" },
        { status: 500 }
      );
    }

    // ========================================
    // 5. PAYPAL API CALL
    // ========================================
    try {
      // Get PayPal access token
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
        const authError = await authResponse.text();
        throw new Error(`PayPal authentication failed: ${authError}`);
      }

      const { access_token } = await authResponse.json();

      // Create payout batch
      const batchId = `PAYOUT_${requestId.substring(0, 8)}_${Date.now()}`;
      const payoutPayload = {
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: "You have received a payout from Digital Store",
          email_message: "Your payout has been processed successfully.",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: payoutRequest.amount.toFixed(2),
              currency: "USD",
            },
            receiver: payoutRequest.payout_email,
            note: `Payout for seller earnings - Request #${requestId.substring(
              0,
              8
            )}`,
            sender_item_id: requestId,
          },
        ],
      };

      console.log("[PAYOUT] Sending to PayPal:", {
        batchId,
        amount: payoutRequest.amount,
        receiver: payoutRequest.payout_email,
      });

      const payoutResponse = await fetch(
        `${PAYPAL_API_URL}/v1/payments/payouts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify(payoutPayload),
        }
      );

      const payoutResult = await payoutResponse.json();

      if (!payoutResponse.ok) {
        const errorMsg =
          payoutResult.message ||
          payoutResult.error_description ||
          payoutResult.details?.[0]?.issue ||
          "PayPal payout failed";
        throw new Error(errorMsg);
      }

      // ========================================
      // 6. SAVE BATCH ID (Stay as "processing")
      // ========================================
      // IMPORTANT: We do NOT set completed here!
      // The webhook will set completed when PayPal confirms
      await adminClient
        .from("payout_requests")
        .update({
          paypal_batch_id: payoutResult.batch_header.payout_batch_id,
          paypal_response: payoutResult,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // status remains "processing"
        })
        .eq("id", requestId);

      console.log(
        "[PAYOUT] Success - Batch ID:",
        payoutResult.batch_header.payout_batch_id
      );

      return NextResponse.json({
        success: true,
        batchId: payoutResult.batch_header.payout_batch_id,
        status: "processing", // Explicitly tell frontend it's processing, not complete
        message: "Payout sent to PayPal. Awaiting confirmation.",
      });
    } catch (paypalError: unknown) {
      // ========================================
      // 7. ROLLBACK ON FAILURE
      // ========================================
      const errorMessage =
        paypalError instanceof Error
          ? paypalError.message
          : "PayPal processing failed";

      console.error("[PAYOUT] PayPal error:", errorMessage);

      // Mark as failed and record reason
      await adminClient
        .from("payout_requests")
        .update({
          status: "failed",
          failure_reason: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      // Refund the seller's available_balance
      await adminClient.rpc("fail_payout", {
        p_request_id: requestId,
        p_reason: errorMessage,
      });

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("[PAYOUT] Process error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
