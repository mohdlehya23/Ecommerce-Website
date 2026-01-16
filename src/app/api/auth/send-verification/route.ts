import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

// Force dynamic rendering
export const dynamic = "force-dynamic";

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
      .select("email, full_name, email_confirmed, last_verification_sent_at")
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

    // Send verification email using Resend
    const emailResult = await sendVerificationEmail({
      userId: user.id,
      userEmail: profile.email || user.email || "",
      userName: profile.full_name || profile.email?.split("@")[0] || "User",
      verificationToken: token,
    });

    if (!emailResult.success) {
      console.error("Email send failed:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    console.log("[VERIFICATION] Email sent to:", profile.email);

    return NextResponse.json({
      success: true,
      message: "Verification email sent! Check your inbox.",
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
