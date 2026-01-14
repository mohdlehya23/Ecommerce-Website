import type { Metadata } from "next";
import { NewsletterForm } from "./NewsletterForm";

export const metadata: Metadata = {
  title: "Newsletter | Digital Store",
  description:
    "Subscribe to our newsletter for exclusive tips, deals, and insights for digital creators.",
};

export default function NewsletterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center section-padding">
      <div className="w-full max-w-md">
        <div className="card text-center">
          {/* Header */}
          <div className="mb-8">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Join Our Newsletter</h1>
            <p className="text-muted text-sm">
              Get weekly tips, exclusive deals, and insights to grow your
              digital business.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-8 text-left">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-green-600"
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
                <span className="text-sm text-muted">
                  Weekly curated tips for creators
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-green-600"
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
                <span className="text-sm text-muted">
                  Early access to new products
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-green-600"
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
                <span className="text-sm text-muted">
                  Exclusive discounts & offers
                </span>
              </li>
            </ul>
          </div>

          {/* Form */}
          <NewsletterForm />
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-muted mt-4">
          No spam, ever. Unsubscribe anytime.
          <br />
          By subscribing, you agree to our{" "}
          <a href="/privacy-policy" className="text-accent hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
