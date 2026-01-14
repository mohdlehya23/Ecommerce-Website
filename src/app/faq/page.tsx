import type { Metadata } from "next";
import Link from "next/link";
import { FAQClient } from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ | Digital Store",
  description:
    "Find answers to frequently asked questions about orders, downloads, refunds, licenses, and more.",
};

const faqs = [
  {
    category: "Delivery",
    questions: [
      {
        question: "How do I access my purchased products?",
        answer:
          "After completing your purchase, you can access your products immediately from your Dashboard. Go to Dashboard → Orders → Click on your order → Download. Each download link is secure and expires after 1 hour for security reasons.",
      },
      {
        question: "My download link expired. How can I get a new one?",
        answer:
          "Download links expire after 1 hour for security. Simply log in to your Dashboard, go to Orders, and click the Download button again to generate a new secure link.",
      },
      {
        question: "Can I download my products on multiple devices?",
        answer:
          "Yes, you can download your products on any device by logging into your account. However, you cannot share your account or download links with others.",
      },
    ],
  },
  {
    category: "Refunds",
    questions: [
      {
        question: "What is your refund policy?",
        answer:
          "We offer refunds within 14 days of purchase if the product is significantly different from its description or if you experience technical issues. Downloaded products are generally not eligible for refunds due to the nature of digital goods. See our full Refund Policy for details.",
      },
      {
        question: "How long does a refund take?",
        answer:
          "Once approved, refunds are processed within 5-7 business days. The time to reflect in your account depends on your payment method and bank.",
      },
    ],
  },
  {
    category: "Licensing",
    questions: [
      {
        question:
          "What's the difference between Personal and Commercial licenses?",
        answer:
          "Personal License (B2C) allows use in personal, non-commercial projects. Commercial License (B2B) allows use in commercial projects, client work, and products for sale. Commercial licenses are available to Business account holders at discounted B2B pricing.",
      },
      {
        question: "Can I use products in client projects?",
        answer:
          "Only with a Commercial License (B2B). Personal licenses are for your own non-commercial use only. Upgrade to a Business account to access commercial licensing.",
      },
      {
        question: "Can I resell or redistribute products?",
        answer:
          "No. Products cannot be resold, redistributed, or shared as standalone items. You can only use them in your own projects (personal or commercial depending on license).",
      },
    ],
  },
  {
    category: "Business Accounts",
    questions: [
      {
        question: "How do I get business invoices?",
        answer:
          "Business account holders automatically receive proper invoices with VAT details for every purchase. You can download invoices from your Dashboard → Orders → Download Invoice.",
      },
      {
        question: "Can I upgrade from Individual to Business account?",
        answer:
          "Yes! Contact our support team and we'll help you upgrade your account while preserving your order history. You'll need to provide company details and VAT/Tax ID.",
      },
      {
        question: "Do you offer bulk or team pricing?",
        answer:
          "Yes, Business accounts get up to 40% off regular pricing. For large teams or enterprise needs, contact us for custom pricing.",
      },
    ],
  },
  {
    category: "Security & Privacy",
    questions: [
      {
        question: "Is my payment information secure?",
        answer:
          "Yes, all payments are processed through PayPal, a trusted and secure payment processor. We never store your complete payment card information on our servers.",
      },
      {
        question: "Can sellers see my personal information?",
        answer:
          "Sellers only receive the information needed to fulfill orders and provide support. Your payment details are never shared with sellers. Our Row Level Security (RLS) ensures complete data isolation between users.",
      },
    ],
  },
  {
    category: "Sellers",
    questions: [
      {
        question: "How do I become a seller?",
        answer:
          "Click 'Become a Seller' in your dashboard. You can start adding products immediately. Payouts are enabled once you complete your payout settings (PayPal email).",
      },
      {
        question: "When do sellers get paid?",
        answer:
          "Payouts are processed according to our schedule (typically weekly or monthly). You can view your payout history and status in the Seller Dashboard → Payouts.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Header */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-primary-200">
              Find quick answers to common questions about our platform.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <FAQClient faqs={faqs} />

            {/* Bottom CTAs */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card text-center">
                  <h3 className="font-semibold mb-2">Still have questions?</h3>
                  <p className="text-muted text-sm mb-4">
                    Our support team is ready to help.
                  </p>
                  <Link href="/contact" className="btn-outline text-sm">
                    Contact Support
                  </Link>
                </div>
                <div className="card text-center bg-accent/5 border-accent/20">
                  <h3 className="font-semibold mb-2">Ready to explore?</h3>
                  <p className="text-muted text-sm mb-4">
                    Browse our collection of digital products.
                  </p>
                  <Link href="/products" className="btn-primary text-sm">
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
