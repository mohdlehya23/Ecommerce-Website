import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Digital Store",
  description:
    "Learn about our digital marketplace platform, our mission to empower creators, and our commitment to quality digital products.",
};

const values = [
  {
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Quality First",
    description:
      "Every product is reviewed to ensure it meets our high standards.",
  },
  {
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
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    title: "Secure & Private",
    description:
      "Your data is protected with industry-leading security measures.",
  },
  {
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
    title: "Instant Delivery",
    description:
      "Get immediate access to your purchases with secure download links.",
  },
  {
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
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    title: "Creator-Focused",
    description:
      "We empower creators with tools to sell and grow their business.",
  },
  {
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
          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    title: "24/7 Support",
    description: "Our team is always here to help you succeed.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Header */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Digital Store
            </h1>
            <p className="text-lg md:text-xl text-primary-200">
              We&apos;re building the future of digital commerce — a marketplace
              where creators thrive and customers find exceptional digital
              products.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vision */}
            <div className="card">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted">
                To become the leading platform for digital creators and
                businesses, enabling anyone to monetize their expertise and
                reach a global audience with premium digital products.
              </p>
            </div>

            {/* Mission */}
            <div className="card">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-accent"
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
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted">
                To provide a seamless, secure, and creator-friendly marketplace
                that connects talented individuals with customers seeking
                high-quality ebooks, templates, and consulting services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="section-padding bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div key={index} className="card text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-accent">
                  {value.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-muted text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Who We Serve
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </span>
                  Individual Buyers (B2C)
                </h3>
                <ul className="space-y-2 text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    Freelancers looking for templates and tools
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    Students and lifelong learners
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    Entrepreneurs starting their journey
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </span>
                  Business Buyers (B2B)
                </h3>
                <ul className="space-y-2 text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    Agencies needing commercial licenses
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    Teams looking for bulk pricing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    Companies seeking consulting services
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-accent to-accent-600">
        <div className="container-wide text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Explore?
          </h2>
          <p className="text-accent-100 max-w-2xl mx-auto mb-8">
            Discover premium digital products from talented creators worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-accent font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Browse Products
            </Link>
            <Link
              href="/business"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              For Business
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
