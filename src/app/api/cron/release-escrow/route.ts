import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/cron/release-escrow
// Called daily by cron job to release funds from escrow after 14 days
// Vercel Cron or external cron service should call this endpoint
//
// Security: Requires CRON_SECRET in Authorization header
// Idempotency: Safe to call multiple times - won't double-credit sellers

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // ========================================
    // 1. VERIFY CRON SECRET
    // ========================================
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, always verify the cron secret
    if (process.env.NODE_ENV === "production" && !cronSecret) {
      console.error("[CRON] CRON_SECRET not configured in production");
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON] Unauthorized escrow release attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ========================================
    // 2. CALL RELEASE MATURED ESCROW RPC
    // ========================================
    const adminClient = createAdminClient();

    console.log("[CRON] Starting escrow release job...");

    const { data: result, error } = await adminClient.rpc(
      "release_matured_escrow"
    );

    if (error) {
      console.error("[CRON] RPC error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to release escrow funds",
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // ========================================
    // 3. LOG AND RETURN RESULTS
    // ========================================
    const executionTime = Date.now() - startTime;

    // Parse JSONB result from RPC
    const releaseResult =
      typeof result === "object" ? result : { success: false };

    console.log("[CRON] Escrow release completed:", {
      success: releaseResult.success,
      records_processed: releaseResult.records_processed || 0,
      total_amount_released: releaseResult.total_amount_released || 0,
      seller_count: releaseResult.seller_count || 0,
      execution_time_ms: executionTime,
    });

    if (!releaseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: releaseResult.error || "Unknown error",
          log_id: releaseResult.log_id,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      records_processed: releaseResult.records_processed || 0,
      total_amount_released: releaseResult.total_amount_released || 0,
      seller_count: releaseResult.seller_count || 0,
      execution_time_ms: executionTime,
      log_id: releaseResult.log_id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("[CRON] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST endpoint also supported for flexibility
export async function POST(request: Request) {
  return GET(request);
}
