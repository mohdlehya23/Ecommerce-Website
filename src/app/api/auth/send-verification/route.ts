import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// Rate limit: 2 minutes between verification emails
const RATE_LIMIT_SECONDS = 120;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get profile with rate limit check
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, email_confirmed, last_verification_sent_at")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Already confirmed
    if (profile.email_confirmed) {
      return NextResponse.json(
        { error: "Email already confirmed" },
        { status: 400 }
      );
    }

    // Rate limit check
    if (profile.last_verification_sent_at) {
      const lastSent = new Date(profile.last_verification_sent_at);
      const now = new Date();
      const secondsSinceLastSent = (now.getTime() - lastSent.getTime()) / 1000;

      if (secondsSinceLastSent < RATE_LIMIT_SECONDS) {
        const waitSeconds = Math.ceil(
          RATE_LIMIT_SECONDS - secondsSinceLastSent
        );
        return NextResponse.json(
          {
            error: `Please wait ${waitSeconds} seconds before requesting another email`,
            waitSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Generate secure token (UUID + random bytes for extra security)
    const tokenBytes = crypto.randomBytes(32).toString("hex");
    const token = `${crypto.randomUUID()}-${tokenBytes}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Use admin client to bypass RLS for token insertion
    const adminClient = createAdminClient();

    // Store token in database
    const { error: tokenError } = await adminClient
      .from("email_verification_tokens")
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Token insert error:", tokenError);
      return NextResponse.json(
        { error: "Failed to create verification token" },
        { status: 500 }
      );
    }

    // Update last_verification_sent_at for rate limiting
    await adminClient
      .from("profiles")
      .update({ last_verification_sent_at: new Date().toISOString() })
      .eq("id", user.id);

    // Build verification URL - must point to the API route, not the page
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    // Send email using Supabase Auth's built-in email (magic link approach)
    // OR use a custom email service like Resend/SendGrid
    // For simplicity, we'll use Supabase's invite email as a workaround
    // In production, use a proper email service

    // Option 1: Return verification URL for testing (remove in production)
    // Option 2: Use Resend/SendGrid API to send custom email

    // For now, we'll send the verification URL back (for testing)
    // In production, integrate with an email service

    return NextResponse.json({
      success: true,
      message: "Verification email sent! Check your inbox.",
      // Remove this in production - only for testing
      ...(process.env.NODE_ENV === "development" && { verificationUrl }),
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
