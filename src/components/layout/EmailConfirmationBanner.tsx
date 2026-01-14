"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function EmailConfirmationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkConfirmation() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if email is confirmed via profiles table (source of truth)
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_confirmed")
          .eq("id", user.id)
          .single();

        // If profile exists, check its confirmation status
        // If profile doesn't exist (edge case), fallback to user metadata or default false
        const isConfirmed = profile
          ? profile.email_confirmed
          : !!user.email_confirmed_at;
        setShowBanner(!isConfirmed);
      }
    }

    checkConfirmation();
  }, []);

  const handleResendEmail = async () => {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited
          setError(
            `Please wait ${data.waitSeconds} seconds before trying again.`
          );
        } else {
          setError(data.error || "Failed to send verification email");
        }
        return;
      }

      setSent(true);

      // If in development, show the verification URL for testing
      if (data.verificationUrl) {
        console.log("Verification URL:", data.verificationUrl);
      }
    } catch (err) {
      console.error("Error sending verification:", err);
      setError("Failed to send verification email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container-wide py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-800">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm">
              Please confirm your email address to access all features.
            </span>
          </div>

          {sent ? (
            <span className="text-sm text-green-700 font-medium">
              ✓ Confirmation email sent! Check your inbox.
            </span>
          ) : error ? (
            <span className="text-sm text-red-700 font-medium">{error}</span>
          ) : (
            <button
              onClick={handleResendEmail}
              disabled={sending}
              className="text-sm font-medium text-amber-900 hover:text-amber-700 underline disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send confirmation email"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
