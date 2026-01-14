import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/payouts/request
// Seller requests a payout from their available balance
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: "Minimum payout amount is $10" },
        { status: 400 }
      );
    }

    // Verify user is a seller
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id, available_balance, payout_paypal_email, payout_email")
      .eq("id", user.id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: "Seller account not found" },
        { status: 404 }
      );
    }

    // Check payout email is configured
    const payoutEmail = seller.payout_paypal_email || seller.payout_email;
    if (!payoutEmail) {
      return NextResponse.json(
        { error: "Please configure your payout email first" },
        { status: 400 }
      );
    }

    // Check sufficient balance
    if (amount > seller.available_balance) {
      return NextResponse.json(
        { error: "Insufficient available balance" },
        { status: 400 }
      );
    }

    // Call the RPC function to create payout request
    const { data: requestId, error: rpcError } = await supabase.rpc(
      "request_payout",
      {
        p_seller_id: user.id,
        p_amount: amount,
      }
    );

    if (rpcError) {
      console.error("Payout request error:", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "Failed to create payout request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId,
      message: "Payout request submitted successfully",
    });
  } catch (error) {
    console.error("Payout request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
