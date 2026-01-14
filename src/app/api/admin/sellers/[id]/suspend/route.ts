import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/admin/sellers/[id]/suspend - Suspend or unsuspend a seller
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminCheck } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sellerId } = params;
    const body = await request.json();
    const { suspend, reason } = body;

    if (typeof suspend !== "boolean") {
      return NextResponse.json(
        { error: "'suspend' must be a boolean" },
        { status: 400 }
      );
    }

    // Call the suspend_seller RPC
    const { data: result, error } = await adminClient.rpc("suspend_seller", {
      p_seller_id: sellerId,
      p_admin_id: user.id,
      p_reason: reason || null,
      p_suspend: suspend,
    });

    if (error) {
      console.error("Suspend seller error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update seller status" },
        { status: 500 }
      );
    }

    if (result && !result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: suspend ? "Seller suspended" : "Seller unsuspended",
      seller_id: sellerId,
      is_suspended: suspend,
    });
  } catch (error) {
    console.error("Suspend seller error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
