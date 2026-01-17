"use server";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * POST /api/auth/forgot-password
 *
 * Generates a password reset link using Supabase Admin API and sends
 * a custom branded email via Resend.
 *
 * Security:
 * - Returns generic success message regardless of whether email exists
 * - Reset links are single-use and expire after 1 hour (Supabase default)
 * - Uses admin API to generate secure recovery tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email input
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // Get site URL for redirect
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      "http://localhost:3000";

    // Ensure URL has https in production
    const baseUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

    // Generate password reset link using Supabase Admin API
    // This creates a single-use token that expires after 1 hour
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: email.toLowerCase().trim(),
      options: {
        redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
      },
    });

    if (error) {
      // Log the error but don't expose it to the user
      console.error("[FORGOT PASSWORD] Error generating link:", error.message);

      // For "User not found" errors, we still return success for privacy
      // Don't reveal whether the email exists in the system
      return NextResponse.json({
        success: true,
        message:
          "If an account exists for this email, you will receive a reset link shortly.",
      });
    }

    if (data?.properties?.action_link) {
      // Get user info for personalized email
      const { data: userData } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("email", email.toLowerCase().trim())
        .single();

      const userName = userData?.full_name || email.split("@")[0];

      // Send custom branded email via Resend
      const emailResult = await sendPasswordResetEmail({
        userId: data.user?.id || "unknown",
        userEmail: email.toLowerCase().trim(),
        userName: userName,
        resetUrl: data.properties.action_link,
      });

      if (!emailResult.success) {
        console.error(
          "[FORGOT PASSWORD] Failed to send email:",
          emailResult.error,
        );
        // Still return success to user - they can try again
      } else {
        console.log(`[FORGOT PASSWORD] Reset email sent to ${email}`);
      }
    }

    // Always return success for privacy (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message:
        "If an account exists for this email, you will receive a reset link shortly.",
    });
  } catch (error) {
    console.error("[FORGOT PASSWORD] Unexpected error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
