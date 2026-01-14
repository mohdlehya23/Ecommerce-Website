import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help Center | Digital Store",
  description:
    "Get help with your orders, downloads, account, and more. Browse our guides or contact support.",
};

const helpCategories = [
  {
    title: "Getting Started",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    links: [
      { label: "Creating an account", href: "/register" },
      { label: "Browsing products", href: "/products" },
      { label: "Making your first purchase", href: "/faq#delivery" },
    ],
  },
  {
    title: "Orders & Downloads",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    ),
    links: [
      { label: "Accessing your downloads", href: "/dashboard" },
      { label: "Download link expired", href: "/faq#delivery" },
      { label: "Order confirmation", href: "/faq#delivery" },
    ],
  },
  {
    title: "Payments & Billing",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    links: [
      { label: "Payment methods", href: "/faq#payments" },
      { label: "Business invoices", href: "/faq#business" },
      { label: "Refund requests", href: "/refund-policy" },
    ],
  },
  {
    title: "Account & Security",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    links: [
      { label: "Reset password", href: "/forgot-password" },
      { label: "Update profile", href: "/dashboard" },
      { label: "Privacy & security", href: "/privacy-policy" },
    ],
  },
  {
    title: "Licensing",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    links: [
      { label: "Personal vs Commercial", href: "/faq#licensing" },
      { label: "Business accounts", href: "/business" },
      { label: "Terms of use", href: "/terms" },
    ],
  },
  {
    title: "Selling",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    links: [
      { label: "Become a seller", href: "/seller" },
      { label: "Payouts & earnings", href: "/faq#sellers" },
      { label: "Seller guidelines", href: "/terms#sellers" },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      {/* Header */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
            <p className="text-lg text-primary-200 mb-8">
              Find answers, guides, and support for all your questions.
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search FAQs
            </Link>
          </div>
        </div>
      </section>

      {/* Help Categories Grid */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => (
              <div key={category.title} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                    {category.icon}
                  </div>
                  <h2 className="font-bold">{category.title}</h2>
                </div>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted hover:text-accent transition-colors flex items-center gap-2"
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="section-padding bg-gray-50">
        <div className="container-wide">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">
              Can&apos;t find what you need?
            </h2>
            <p className="text-muted mb-8">
              Our support team is here to help. Reach out and we&apos;ll get
              back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">
                Contact Support
              </Link>
              <Link href="/faq" className="btn-outline">
                Browse All FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
