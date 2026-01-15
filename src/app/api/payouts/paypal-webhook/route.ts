import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPayoutConfirmationEmail } from "@/lib/email";

// POST /api/payouts/paypal-webhook
// Handles PayPal webhook events for payout status updates
// This is the ONLY place where status should be set to "completed"

export async function POST(request: Request) {
  const adminClient = createAdminClient();

  try {
    const body = await request.json();
    const eventType = body.event_type;

    console.log("[WEBHOOK] Received PayPal event:", eventType);
    console.log("[WEBHOOK] Resource:", JSON.stringify(body.resource, null, 2));

    // ========================================
    // HANDLE DIFFERENT PAYPAL PAYOUT EVENTS
    // ========================================
    switch (eventType) {
      // ----------------------------------------
      // BATCH SUCCESS: All items in batch succeeded
      // ----------------------------------------
      case "PAYMENT.PAYOUTSBATCH.SUCCESS": {
        const batchId = body.resource?.batch_header?.payout_batch_id;
        if (batchId) {
          console.log("[WEBHOOK] Batch succeeded:", batchId);

          const { error } = await adminClient
            .from("payout_requests")
            .update({
              status: "completed",
              paypal_response: body.resource,
              updated_at: new Date().toISOString(),
            })
            .eq("paypal_batch_id", batchId);

          if (error) {
            console.error("[WEBHOOK] Failed to update batch success:", error);
          }
        }
        break;
      }

      // ----------------------------------------
      // ITEM SUCCESS: Individual payout item succeeded
      // ----------------------------------------
      case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED": {
        const senderItemId = body.resource?.payout_item?.sender_item_id;
        const transactionId = body.resource?.transaction_id;
        const payoutItemId = body.resource?.payout_item_id;

        if (senderItemId) {
          console.log(
            "[WEBHOOK] Item succeeded:",
            senderItemId,
            "TxID:",
            transactionId
          );

          // First, get the payout request with seller info
          const { data: payoutRequest } = await adminClient
            .from("payout_requests")
            .select(
              `
              id,
              amount,
              payout_email,
              seller_id,
              seller:sellers (
                id,
                user_id,
                profile:profiles (
                  full_name,
                  email
                )
              )
            `
            )
            .eq("id", senderItemId)
            .single();

          // Update payout status
          const { error } = await adminClient
            .from("payout_requests")
            .update({
              status: "completed",
              paypal_transaction_id: transactionId,
              paypal_payout_item_id: payoutItemId,
              paypal_response: body.resource,
              updated_at: new Date().toISOString(),
            })
            .eq("id", senderItemId);

          if (error) {
            console.error("[WEBHOOK] Failed to update item success:", error);
          }

          // Send email notification to seller
          if (payoutRequest) {
            const seller = payoutRequest.seller as any;
            const profile = seller?.profile;
            const sellerEmail = profile?.email || payoutRequest.payout_email;
            const sellerName = profile?.full_name || "Seller";

            if (sellerEmail) {
              const emailResult = await sendPayoutConfirmationEmail({
                payoutId: senderItemId,
                sellerEmail,
                sellerName,
                amount: payoutRequest.amount,
                paypalEmail: payoutRequest.payout_email,
              });

              if (emailResult.success) {
                console.log(
                  "[WEBHOOK] Payout confirmation email sent to:",
                  sellerEmail
                );
              } else {
                console.error(
                  "[WEBHOOK] Failed to send payout email:",
                  emailResult.error
                );
              }
            }
          }
        }
        break;
      }

      // ----------------------------------------
      // ITEM FAILURES: Handle all failure types
      // ----------------------------------------
      case "PAYMENT.PAYOUTS-ITEM.FAILED":
      case "PAYMENT.PAYOUTS-ITEM.BLOCKED":
      case "PAYMENT.PAYOUTS-ITEM.RETURNED":
      case "PAYMENT.PAYOUTS-ITEM.REFUNDED":
      case "PAYMENT.PAYOUTS-ITEM.CANCELED":
      case "PAYMENT.PAYOUTS-ITEM.UNCLAIMED": {
        const senderItemId = body.resource?.payout_item?.sender_item_id;
        const errorInfo = body.resource?.errors;
        const transactionStatus = body.resource?.transaction_status;

        const errorMessage =
          errorInfo?.message ||
          errorInfo?.name ||
          transactionStatus ||
          eventType.replace("PAYMENT.PAYOUTS-ITEM.", "");

        if (senderItemId) {
          console.log(
            "[WEBHOOK] Item failed:",
            senderItemId,
            "Reason:",
            errorMessage
          );

          // Call the fail_payout RPC to refund seller and mark as failed
          const { error } = await adminClient.rpc("fail_payout", {
            p_request_id: senderItemId,
            p_reason: errorMessage,
          });

          if (error) {
            console.error("[WEBHOOK] Failed to call fail_payout RPC:", error);

            // Fallback: direct update
            await adminClient
              .from("payout_requests")
              .update({
                status: "failed",
                failure_reason: errorMessage,
                paypal_response: body.resource,
                updated_at: new Date().toISOString(),
              })
              .eq("id", senderItemId);
          }
        }
        break;
      }

      // ----------------------------------------
      // BATCH DENIED: Entire batch was denied
      // ----------------------------------------
      case "PAYMENT.PAYOUTSBATCH.DENIED": {
        const batchId = body.resource?.batch_header?.payout_batch_id;
        const errorMessage = "PayPal batch denied";

        if (batchId) {
          console.log("[WEBHOOK] Batch denied:", batchId);

          // Get all requests with this batch ID
          const { data: requests } = await adminClient
            .from("payout_requests")
            .select("id")
            .eq("paypal_batch_id", batchId)
            .eq("status", "processing");

          // Fail each one and refund seller
          for (const req of requests || []) {
            await adminClient.rpc("fail_payout", {
              p_request_id: req.id,
              p_reason: errorMessage,
            });
          }
        }
        break;
      }

      // ----------------------------------------
      // BATCH PROCESSING: Batch is being processed
      // ----------------------------------------
      case "PAYMENT.PAYOUTSBATCH.PROCESSING": {
        const batchId = body.resource?.batch_header?.payout_batch_id;
        console.log("[WEBHOOK] Batch processing:", batchId);
        // No action needed, already in processing status
        break;
      }

      // ----------------------------------------
      // UNHANDLED EVENTS: Log for debugging
      // ----------------------------------------
      default:
        console.log("[WEBHOOK] Unhandled event type:", eventType);
    }

    // Always return 200 to acknowledge receipt
    // PayPal will retry on non-2xx responses
    return NextResponse.json({
      received: true,
      event: eventType,
    });
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);

    // Return 200 anyway to prevent PayPal retries on parse errors
    // Log the error for debugging
    return NextResponse.json({
      received: true,
      error: "Processing error logged",
    });
  }
}

// GET endpoint for webhook verification (some providers require this)
export async function GET() {
  return NextResponse.json({
    status: "Webhook endpoint active",
    path: "/api/payouts/paypal-webhook",
  });
}
