import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | Digital Store",
  description:
    "Learn about our refund policy for digital products, including eligibility criteria and how to request a refund.",
};

export default function RefundPolicyPage() {
  return (
    <>
      {/* Header */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Refund Policy
            </h1>
            <p className="text-lg text-primary-200">
              We want you to be completely satisfied with your purchase.
              Here&apos;s what you need to know about refunds.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            {/* Policy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Eligible */}
              <div className="card border-l-4 border-l-green-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
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
                  <h2 className="text-xl font-bold">Eligible for Refund</h2>
                </div>
                <ul className="space-y-3 text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Product significantly different from description
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Technical issues preventing access or use
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Duplicate purchase (same product twice)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Request within 14 days of purchase
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Consulting session not yet scheduled
                  </li>
                </ul>
              </div>

              {/* Not Eligible */}
              <div className="card border-l-4 border-l-red-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold">Not Eligible for Refund</h2>
                </div>
                <ul className="space-y-3 text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✕</span>
                    Change of mind after downloading
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✕</span>
                    Files already downloaded successfully
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✕</span>
                    Consulting session already completed
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✕</span>
                    Request after 14 days of purchase
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✕</span>
                    Promotional or heavily discounted items
                  </li>
                </ul>
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-blue-600"
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
                </div>
                <div>
                  <h3 className="font-semibold mb-2">About Digital Delivery</h3>
                  <p className="text-muted text-sm">
                    All digital products are delivered instantly via secure
                    download links that expire after 1 hour. Due to the nature
                    of digital products, once a file has been successfully
                    downloaded, we cannot verify that it hasn&apos;t been copied
                    or used, which is why downloaded products are generally not
                    eligible for refunds.
                  </p>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="card bg-gray-50 text-center">
              <h3 className="text-xl font-bold mb-2">Need Help?</h3>
              <p className="text-muted mb-6">
                If you believe you&apos;re eligible for a refund or have
                questions about your purchase, our support team is here to help.
              </p>
              <Link href="/contact" className="btn-primary">
                Contact Support
              </Link>
            </div>

            {/* Last Updated */}
            <p className="text-center text-xs text-muted mt-8">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
