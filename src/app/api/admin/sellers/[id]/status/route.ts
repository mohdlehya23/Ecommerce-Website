import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/admin/sellers/[id]/status - Update seller status
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
    const { seller_status } = body;

    if (
      !seller_status ||
      !["active", "payouts_locked", "suspended"].includes(seller_status)
    ) {
      return NextResponse.json(
        { error: "Invalid seller status" },
        { status: 400 }
      );
    }

    // Get current seller data for audit
    const { data: seller } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", id)
      .single();

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Update seller status
    const { data: updatedSeller, error } = await supabase
      .from("sellers")
      .update({ seller_status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "update_seller_status",
      entity_type: "seller",
      entity_id: id,
      before: { seller_status: seller.seller_status },
      after: { seller_status },
    });

    return NextResponse.json({
      message: "Seller status updated successfully",
      seller: updatedSeller,
    });
  } catch (error: any) {
    console.error("Error updating seller status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
