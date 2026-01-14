"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const supabase = createClient();

      // Get the site URL from environment or window
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        throw error;
      }

      // Always show success for privacy (don't reveal if email exists)
      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error("Password reset error:", error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Alert */}
      {status === "success" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Check your email</span>
          </div>
          <p className="text-green-600 text-sm mt-1">
            If an account exists, you&apos;ll receive a password reset link
            shortly.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {status === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
          placeholder="your@email.com"
          disabled={status === "success"}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || status === "success"}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sending...
          </span>
        ) : status === "success" ? (
          "Email Sent"
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}
