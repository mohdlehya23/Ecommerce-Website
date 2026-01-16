import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Force dynamic rendering - this route uses searchParams
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    console.log("=== VERIFY EMAIL DEBUG ===");
    console.log(
      "Token received:",
      token ? token.substring(0, 20) + "..." : "null"
    );

    if (!token) {
      console.log("ERROR: No token provided");
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=missing_token", request.url)
      );
    }

    const adminClient = createAdminClient();

    // Find the token
    console.log("Looking up token in database...");
    const { data: tokenRecord, error: tokenError } = await adminClient
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError) {
      console.log("Token lookup error:", tokenError);
    }

    if (tokenError || !tokenRecord) {
      console.log("ERROR: Token not found in database");
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=invalid_token", request.url)
      );
    }

    console.log("Token found! User ID:", tokenRecord.user_id);
    console.log("Token expires at:", tokenRecord.expires_at);
    console.log("Token used at:", tokenRecord.used_at);

    // Check if already used
    if (tokenRecord.used_at) {
      console.log("ERROR: Token already used");
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=already_used", request.url)
      );
    }

    // Check if expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      console.log("ERROR: Token expired");
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=expired", request.url)
      );
    }

    // Mark token as used
    console.log("Marking token as used...");
    const { error: updateTokenError } = await adminClient
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id);

    if (updateTokenError) {
      console.log("ERROR: Failed to mark token as used:", updateTokenError);
    }

    // Update profile to confirmed
    console.log("Updating profile to confirmed...");
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ email_confirmed: true })
      .eq("id", tokenRecord.user_id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=update_failed", request.url)
      );
    }

    console.log("SUCCESS! Email verified for user:", tokenRecord.user_id);

    // Success! Redirect to success page
    return NextResponse.redirect(
      new URL("/auth/verify-email?success=true", request.url)
    );
  } catch (error) {
    console.error("=== VERIFY EMAIL CRASH ===");
    console.error("Error:", error);
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=server_error", request.url)
    );
  }
}
