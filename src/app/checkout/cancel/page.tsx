import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Cancelled | Digital Store",
  description:
    "Your payment was cancelled. No charges have been made to your account.",
};

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center section-padding">
      <div className="text-center max-w-lg mx-auto">
        {/* Warning Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full">
            <svg
              className="w-12 h-12 text-yellow-600"
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
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Payment Cancelled
        </h1>
        <p className="text-muted mb-8">
          Your payment was cancelled and no charges have been made to your
          account. Your cart items are still saved if you want to try again.
        </p>

        {/* Info Card */}
        <div className="card mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3 text-left">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                No payment was processed
              </p>
              <p className="text-xs text-blue-700">
                If you experienced any issues during checkout, please try again
                or contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/checkout" className="btn-primary">
            Try Again
          </Link>
          <Link href="/products" className="btn-outline">
            Back to Products
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted">
            Having trouble?{" "}
            <Link href="/contact" className="text-accent hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
