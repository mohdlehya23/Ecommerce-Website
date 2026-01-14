import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify token and email
    const { data: order, error } = await supabase
      .from("orders")
      .select("buyer_email, id")
      .eq("receipt_token", token)
      .single();

    if (error || !order) {
      // Don't reveal if token exists or not for security (timing attack mitigation deferred for now)
      return NextResponse.json(
        { error: "Invalid verification" },
        { status: 401 }
      );
    }

    // Normalize emails for comparison
    const normalizedInputEmail = email.trim().toLowerCase();
    const normalizedBuyerEmail = order.buyer_email?.trim().toLowerCase();

    if (normalizedInputEmail !== normalizedBuyerEmail) {
      return NextResponse.json(
        { error: "Invalid verification" },
        { status: 401 }
      );
    }

    // Set HTTP-only cookie for session (15 mins)
    const cookieStore = await cookies();
    cookieStore.set("receipt_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Receipt verification error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
