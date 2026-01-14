import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Digital Store",
  description: "Reset your password and regain access to your account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center section-padding">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Forgot your password?</h1>
            <p className="text-muted text-sm">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {/* Form */}
          <ForgotPasswordForm />

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to login
            </Link>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-muted mt-4">
          If an account exists with this email, you&apos;ll receive a password
          reset link. We don&apos;t reveal whether an email is registered for
          privacy reasons.
        </p>
      </div>
    </div>
  );
}
