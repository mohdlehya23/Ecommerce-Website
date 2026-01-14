import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/payouts/[id]/fail - Mark payout as failed and refund seller
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Failure reason is required" },
        { status: 400 }
      );
    }

    // Call fail_payout RPC
    const { data: success, error } = await supabase.rpc("fail_payout", {
      p_request_id: id,
      p_reason: reason,
    });

    if (error) {
      throw error;
    }

    if (!success) {
      return NextResponse.json(
        { error: "Payout not found or cannot be failed" },
        { status: 404 }
      );
    }

    // Create audit log
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "update_payout_status",
      entity_type: "payout",
      entity_id: id,
      after: { status: "failed", reason },
    });

    return NextResponse.json({
      message: "Payout marked as failed and refunded successfully",
    });
  } catch (error: any) {
    console.error("Error failing payout:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
