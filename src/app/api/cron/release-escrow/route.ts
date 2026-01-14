import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/cron/release-escrow
// Called daily by cron job to release funds from escrow
// Vercel Cron or external cron service should call this endpoint

export async function GET(request: Request) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, verify the cron secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Call the release_escrow_funds function
    const { data: releasedCount, error } = await adminClient.rpc(
      "release_escrow_funds"
    );

    if (error) {
      console.error("Release escrow error:", error);
      return NextResponse.json(
        { error: "Failed to release escrow funds" },
        { status: 500 }
      );
    }

    console.log(`[CRON] Released ${releasedCount} escrow funds`);

    return NextResponse.json({
      success: true,
      releasedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron release escrow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
