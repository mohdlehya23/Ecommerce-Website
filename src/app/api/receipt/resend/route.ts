import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOrderReceiptEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get order with items
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        id, 
        buyer_email, 
        buyer_name,
        total_amount,
        last_receipt_sent_at, 
        receipt_token,
        payment_status,
        order_items (
          price,
          product:products (title)
        )
      `
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow resending for completed orders
    if (order.payment_status !== "completed") {
      return NextResponse.json(
        { error: "Can only resend receipts for completed orders" },
        { status: 400 }
      );
    }

    // Check cooldown (60 seconds)
    if (order.last_receipt_sent_at) {
      const lastSent = new Date(order.last_receipt_sent_at).getTime();
      const now = Date.now();
      if (now - lastSent < 60000) {
        return NextResponse.json(
          { error: "Please wait before resending receipt" },
          { status: 429 }
        );
      }
    }

    // Build receipt URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const receiptUrl = order.receipt_token
      ? `${baseUrl}/purchases/${order.receipt_token}`
      : `${baseUrl}/dashboard/purchases/${order.id}`;

    // Extract items from order
    const items = (order.order_items || []).map((item: any) => ({
      title: item.product?.title || "Product",
      price: item.price || 0,
    }));

    // Send email using the new email utility
    const emailResult = await sendOrderReceiptEmail({
      orderId: order.id,
      buyerEmail: order.buyer_email || user.email || "",
      buyerName: order.buyer_name || user.email?.split("@")[0] || "Customer",
      orderShortId: order.id.slice(0, 8).toUpperCase(),
      totalAmount: order.total_amount || 0,
      receiptUrl,
      items,
    });

    if (!emailResult.success) {
      console.error("[RESEND RECEIPT] Email failed:", emailResult.error);
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Update last_receipt_sent_at
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        last_receipt_sent_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error(
        "[RESEND RECEIPT] Failed to update timestamp:",
        updateError
      );
      // Don't fail the request - email was sent successfully
    }

    console.log(
      `[RESEND RECEIPT] Sent receipt to ${order.buyer_email} for order ${orderId}`
    );

    return NextResponse.json({
      success: true,
      logId: emailResult.logId,
    });
  } catch (err) {
    console.error("Resend receipt error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
