import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/admin/payouts/[id]/status - Update payout status
export async function PATCH(
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
    const { status, note } = body;

    if (
      !status ||
      !["pending", "processing", "completed", "held", "failed"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid payout status" },
        { status: 400 }
      );
    }

    // Get current payout data for audit
    const { data: payout } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    // Update payout status
    const updateData: any = { status };
    if (note) updateData.failure_reason = note; // Map note to failure_reason if needed, or ignore

    const { data: updatedPayout, error } = await supabase
      .from("payout_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "update_payout_status",
      entity_type: "payout",
      entity_id: id,
      before: { status: payout.status, note: payout.note },
      after: { status, note: note || payout.note },
    });

    return NextResponse.json({
      message: "Payout status updated successfully",
      payout: updatedPayout,
    });
  } catch (error: any) {
    console.error("Error updating payout status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
