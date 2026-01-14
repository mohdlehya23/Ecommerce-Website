"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    missing_token: "No verification token provided.",
    invalid_token: "This verification link is invalid.",
    already_used: "This verification link has already been used.",
    expired: "This verification link has expired. Please request a new one.",
    update_failed: "Failed to update your account. Please try again.",
    server_error: "An unexpected error occurred. Please try again.",
  };

  if (success) {
    return (
      <div className="section-padding">
        <div className="container-wide max-w-lg">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-3">
              Email Verified!
            </h1>
            <p className="text-muted mb-6">
              Your email has been successfully verified! Please log in again to
              refresh your session and access all features.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" className="btn-primary">
                Log In
              </Link>
              <Link href="/" className="btn-outline">
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-wide max-w-lg">
        <div className="card text-center py-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-3">
            Verification Failed
          </h1>
          <p className="text-muted mb-6">
            {error
              ? errorMessages[error] || errorMessages.server_error
              : errorMessages.server_error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="btn-outline">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="section-padding">
          <div className="container-wide max-w-lg">
            <div className="card text-center py-12">
              <p className="text-muted">Verifying...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
