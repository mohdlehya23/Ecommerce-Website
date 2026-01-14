import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Business | Digital Store",
  description:
    "Unlock bulk pricing, commercial licenses, and dedicated support for your team. Join thousands of businesses using our digital products.",
};

const benefits = [
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
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Bulk Pricing",
    description:
      "Save up to 40% with our business pricing tiers. The more you buy, the more you save.",
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
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Commercial Licenses",
    description:
      "Use our products in client projects and commercial applications without restrictions.",
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    title: "Business Invoices",
    description:
      "Get proper invoices with VAT details for your accounting and expense reports.",
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
    title: "Team Ready",
    description:
      "Share access with your team members and manage purchases from one account.",
  },
];

const steps = [
  {
    number: "1",
    title: "Create Business Account",
    description:
      "Sign up and select 'Business' as your account type during registration.",
  },
  {
    number: "2",
    title: "Add Company Details",
    description:
      "Complete your company profile with VAT/Tax ID for proper invoicing.",
  },
  {
    number: "3",
    title: "Unlock B2B Pricing",
    description: "Instantly see discounted business prices on all products.",
  },
  {
    number: "4",
    title: "Start Purchasing",
    description:
      "Buy products with commercial licenses and get invoices automatically.",
  },
];

const faqs = [
  {
    question: "What's the difference between B2C and B2B accounts?",
    answer:
      "B2B accounts get access to commercial licenses, bulk pricing (up to 40% off), and proper business invoices with VAT details.",
  },
  {
    question: "Can I upgrade my existing account to Business?",
    answer:
      "Yes! Contact our support team and we'll help you upgrade your account while preserving your order history.",
  },
  {
    question: "Do you offer team/enterprise plans?",
    answer:
      "Absolutely. Contact us for custom pricing and features tailored to your organization's needs.",
  },
];

export default function BusinessPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-50" />
        <div className="container-wide relative section-padding">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent-300 rounded-full text-sm font-medium mb-6">
              For Business
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Scale Your Business with{" "}
              <span className="text-accent">Premium Digital Products</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-200 mb-8 max-w-2xl mx-auto">
              Unlock exclusive B2B pricing, commercial licenses, and dedicated
              support. Join thousands of businesses accelerating their growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?type=business"
                className="btn-primary text-lg px-8 py-4"
              >
                Create Business Account
              </Link>
              <Link
                href="/contact"
                className="btn-outline border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Go Business?
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Everything you need to use our digital products professionally
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="card text-center">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Get started with your business account in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block flex-1 h-0.5 bg-border" />
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Common Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="card">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/faq" className="text-accent hover:underline">
                View all FAQs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-accent to-accent-600">
        <div className="container-wide text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-accent-100 max-w-2xl mx-auto mb-8">
            Join thousands of businesses already using our digital products to
            accelerate their growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?type=business"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-accent font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Create Business Account
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
