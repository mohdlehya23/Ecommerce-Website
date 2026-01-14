import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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

    // specific user check
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, buyer_email, last_receipt_sent_at, receipt_token")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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

    // Send email logic would go here (using Resend, SendGrid, etc.)
    // For now, we mock the success and update the timestamp

    // Update last_receipt_sent_at
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        last_receipt_sent_at: new Date().toISOString(),
        receipt_send_count: (order.receipt_send_count || 0) + 1,
      })
      .eq("id", orderId);

    if (updateError) {
      throw updateError;
    }

    // In a real implementation:
    // await sendEmail({
    //   to: order.buyer_email,
    //   subject: "Your Receipt",
    //   html: renderReceiptEmail({ order, token: order.receipt_token })
    // });

    console.log(
      `[MOCK] Sending receipt email to ${order.buyer_email} for order ${orderId}`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend receipt error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
