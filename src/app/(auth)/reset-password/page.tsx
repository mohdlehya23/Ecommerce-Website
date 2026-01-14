import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | Digital Store",
  description: "Set a new password for your account.",
};

export default function ResetPasswordPage() {
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Set a new password</h1>
            <p className="text-muted text-sm">Enter your new password below.</p>
          </div>

          {/* Form */}
          <ResetPasswordForm />
        </div>

        {/* Password Requirements */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-muted font-medium mb-2">
            Password requirements:
          </p>
          <ul className="text-xs text-muted space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-muted rounded-full" />
              At least 8 characters long
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-muted rounded-full" />
              Contains at least one number
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-muted rounded-full" />
              Contains at least one special character
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
