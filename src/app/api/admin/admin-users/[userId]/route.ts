import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/admin/admin-users/[userId] - Remove admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    const { userId } = params;

    // Check admin count - prevent removing last admin
    const { count } = await supabase
      .from("admin_users")
      .select("*", { count: "exact", head: true });

    if (count && count <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last admin" },
        { status: 400 }
      );
    }

    // Get admin data before deletion for audit
    const { data: adminToRemove } = await supabase
      .from("admin_users")
      .select("user_id, created_at")
      .eq("user_id", userId)
      .single();

    if (!adminToRemove) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Delete admin
    const { error: deleteError } = await supabase
      .from("admin_users")
      .delete()
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    // Create audit log
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "remove_admin",
      entity_type: "admin",
      entity_id: userId,
      before: adminToRemove,
    });

    return NextResponse.json({ message: "Admin removed successfully" });
  } catch (error: any) {
    console.error("Error removing admin:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
