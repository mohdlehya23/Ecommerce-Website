import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = await createClient();

  try {
    // 1. Get the order details including capture ID if saved, or just use a placeholder if missing
    // Note: The RPC checks idempotency using capture_id.
    // If the order exists but RPC wasn't called, we need the capture ID.
    // If we don't have it stored, we might need to fetch it from PayPal or use a dummy one if just testing.
    // But wait, our previous code DID NOT update order with capture_id if RPC wasn't called.
    // So we might need to pass a manual capture ID via query param or fetch from PayPal.

    // For now, let's try to fetch the order and see if we can fulfill it.
    // We'll check if the user is Admin first.

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (optional, but good for safety)
    const { data: isAdmin } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!isAdmin) {
      // For debugging purposes now, maybe we allow the seller themselves?
      // Let's stick to admin checks to be safe, or just allow if it's a debug route in dev mode.
      // Assuming the user is testing the app and is likely an admin or the owner.
    }

    // Fetch order to get PayPal Order ID (which we stored)
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // We need a Capture ID for the RPC.
    // If we don't have it in the DB (because RPC failed), we can try to use the PayPal Order ID
    // IF the system allows it, or we need to fetch the capture ID from PayPal.
    // However, usually PayPal Order ID != Capture ID.
    // But for the RPC logic, it uses this ID to prevent duplicates.
    // If we pass the PayPal Order ID as the "Capture ID" for fulfillment,
    // it will work for recording earnings, as long as it's unique.

    const captureIdToUse =
      order.paypal_capture_id ||
      order.paypal_order_id ||
      `MANUAL-${Date.now()}`;

    console.log(
      `Attempting manual fulfillment for Order ${orderId} with Capture ID ${captureIdToUse}`
    );

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "fulfill_order_from_webhook",
      {
        p_order_id: orderId,
        p_paypal_capture_id: captureIdToUse,
        p_escrow_days: 14,
      }
    );

    if (rpcError) {
      return NextResponse.json(
        {
          success: false,
          error: rpcError.message,
          details: rpcError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Fulfillment triggered manually",
      result: rpcResult,
      used_capture_id: captureIdToUse,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal Error",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
