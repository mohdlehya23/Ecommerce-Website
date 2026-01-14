"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center section-padding">
      <div className="text-center max-w-md mx-auto">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
            <svg
              className="w-10 h-10 text-red-500"
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
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted mb-8">
          We apologize for the inconvenience. An unexpected error occurred.
          Please try again or contact support if the problem persists.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-8 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-xs text-muted font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <Link href="/" className="btn-outline">
            Go Home
          </Link>
        </div>

        {/* Support Link */}
        <div className="mt-8">
          <Link href="/contact" className="text-sm text-accent hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
