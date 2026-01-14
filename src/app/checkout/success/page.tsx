import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Successful | Digital Store",
  description:
    "Your payment was successful. Access your purchases from your dashboard.",
};

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center section-padding">
      <div className="text-center max-w-lg mx-auto">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
            <svg
              className="w-12 h-12 text-green-500"
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
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-green-600">
          Payment Successful!
        </h1>
        <p className="text-muted mb-8">
          Thank you for your purchase. Your order has been confirmed and your
          digital products are ready for download in your dashboard.
        </p>

        {/* Order Details Card */}
        <div className="card mb-8 text-left">
          <h2 className="font-semibold mb-4">What happens next?</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-accent text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Check your email</p>
                <p className="text-xs text-muted">
                  We&apos;ve sent a confirmation email with your order details
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-accent text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Access your dashboard</p>
                <p className="text-xs text-muted">
                  Download your products anytime from your account
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-accent text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Get started</p>
                <p className="text-xs text-muted">
                  Enjoy your new digital products!
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
          <Link href="/products" className="btn-outline">
            Continue Shopping
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted">
            Need help with your order?{" "}
            <Link href="/contact" className="text-accent hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
