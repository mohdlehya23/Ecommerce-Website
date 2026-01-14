import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/admin/admin-users - List all admins
export async function GET() {
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

    // Get all admins with email from auth.users
    const { data: admins, error } = await supabase
      .from("admin_users")
      .select("user_id, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch email for each admin using service role
    const serviceSupabase = createServiceClient(
      supabaseUrl,
      supabaseServiceKey
    );
    const adminList = await Promise.all(
      (admins || []).map(async (admin) => {
        const { data: userData } = await serviceSupabase.auth.admin.getUserById(
          admin.user_id
        );
        return {
          user_id: admin.user_id,
          email: userData.user?.email || "Unknown",
          created_at: admin.created_at,
        };
      })
    );

    return NextResponse.json({ admins: adminList });
  } catch (error: any) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/admin-users - Add new admin by email
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Look up user by email using service role
    const serviceSupabase = createServiceClient(
      supabaseUrl,
      supabaseServiceKey
    );
    const { data: users } = await serviceSupabase.auth.admin.listUsers();
    const targetUser = users.users.find((u) => u.email === email);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already admin
    const { data: existingAdmin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", targetUser.id)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "User is already an admin" },
        { status: 409 }
      );
    }

    // Add admin
    const { error: insertError } = await supabase
      .from("admin_users")
      .insert({ user_id: targetUser.id });

    if (insertError) throw insertError;

    // Create audit log
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "add_admin",
      entity_type: "admin",
      entity_id: targetUser.id,
      after: { user_id: targetUser.id, email: targetUser.email },
    });

    return NextResponse.json({
      message: "Admin added successfully",
      admin: {
        user_id: targetUser.id,
        email: targetUser.email,
      },
    });
  } catch (error: any) {
    console.error("Error adding admin:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
