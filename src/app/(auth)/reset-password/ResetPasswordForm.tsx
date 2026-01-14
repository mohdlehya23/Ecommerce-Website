"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "ready" | "success" | "error" | "invalid_link";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();

    // Check for recovery session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setStatus("ready");
      } else {
        // Listen for auth state changes (PASSWORD_RECOVERY event)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" && session) {
            setStatus("ready");
          } else if (!session) {
            setStatus("invalid_link");
          }
        });

        // Small delay to allow auth state to settle
        setTimeout(() => {
          if (status === "loading") {
            setStatus("invalid_link");
          }
        }, 2000);

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    checkSession();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setStatus("success");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Password update error:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to update password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted">Verifying your reset link...</p>
      </div>
    );
  }

  // Invalid/expired link
  if (status === "invalid_link") {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
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
        </div>
        <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
        <p className="text-muted text-sm mb-6">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>
        <Link href="/forgot-password" className="btn-primary">
          Request New Link
        </Link>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-500"
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
        </div>
        <h2 className="text-xl font-bold mb-2">Password Updated!</h2>
        <p className="text-muted text-sm mb-6">
          Your password has been successfully updated. Redirecting to login...
        </p>
        <Link href="/login" className="btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  // Ready - show form
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {errorMessage && (
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

      {/* New Password */}
      <div>
        <label htmlFor="password" className="label">
          New Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="input"
          placeholder="Enter new password"
        />
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="input"
          placeholder="Confirm new password"
        />
      </div>

      {/* Submit Button */}
      <button type="submit" disabled={isLoading} className="btn-primary w-full">
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
            Updating...
          </span>
        ) : (
          "Update Password"
        )}
      </button>
    </form>
  );
}
