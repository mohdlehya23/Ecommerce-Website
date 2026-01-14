import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | Digital Store",
  description:
    "Read our terms of service covering digital delivery, licensing, payments, refunds, and account responsibilities.",
};

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By accessing or using Digital Store, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, you may not use our services.

These terms apply to all users, including visitors, registered users, and sellers on our platform.`,
  },
  {
    id: "digital-delivery",
    title: "Digital Delivery",
    content: `All digital products are delivered electronically through our platform:

• **Instant Access**: Products are available immediately after successful payment
• **Secure Downloads**: Download links are generated using signed URLs for security
• **Link Expiration**: Download links expire after 1 hour for security purposes
• **Re-downloads**: You can access your purchases anytime from your dashboard
• **File Formats**: File formats and sizes are listed on each product page`,
  },
  {
    id: "licensing",
    title: "Licensing & Intellectual Property",
    content: `All products on our platform are protected by intellectual property rights:

**Personal License (B2C)**:
• Use in personal, non-commercial projects
• Cannot be redistributed, resold, or shared
• Cannot be used in products for sale

**Commercial License (B2B)**:
• Use in commercial and client projects
• Cannot be redistributed as standalone products
• End products must add significant value
• Attribution requirements vary by product

The specific license terms for each product are detailed on its product page. Violation of license terms may result in account termination and legal action.`,
  },
  {
    id: "download-security",
    title: "Download Security",
    content: `We implement security measures to protect digital products:

• **Signed URLs**: All download links are cryptographically signed
• **1-Hour Expiration**: Links expire 1 hour after generation
• **Authentication Required**: You must be logged in to access downloads
• **Purchase Verification**: System verifies payment before generating links
• **IP Logging**: Download attempts are logged for security purposes

Attempting to circumvent security measures or share download links violates these terms.`,
  },
  {
    id: "refunds",
    title: "Refunds & Cancellations",
    content: `Due to the nature of digital products, refund eligibility is limited:

**Eligible for Refund**:
• Product materially different from description
• Technical issues preventing access
• Duplicate purchases
• Requests within 14 days of purchase

**Not Eligible**:
• Change of mind after download
• Successfully downloaded files
• Completed consulting sessions

See our full Refund Policy for details.`,
  },
  {
    id: "payments",
    title: "Payments",
    content: `All payments are processed securely through PayPal:

• **Accepted Methods**: PayPal balance, credit/debit cards via PayPal
• **Currency**: All prices are in USD unless otherwise specified
• **B2B Pricing**: Business accounts receive discounted pricing
• **Invoices**: Business customers receive VAT-compliant invoices
• **Seller Payouts**: Sellers receive payments according to our payout schedule

PayPal's terms of service also apply to payment transactions.`,
  },
  {
    id: "accounts",
    title: "Account Responsibility",
    content: `You are responsible for your account:

• **Accurate Information**: Provide accurate registration information
• **Security**: Keep your password confidential and secure
• **Activity**: You are responsible for all activity under your account
• **Notification**: Notify us immediately of unauthorized access
• **One Account**: Each person may maintain only one account

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    id: "sellers",
    title: "Seller Terms",
    content: `If you sell products on our platform:

• **Content Ownership**: You must own or have rights to sell your products
• **Accurate Descriptions**: Product descriptions must be accurate
• **Quality Standards**: Products must meet our quality guidelines
• **Pricing**: You set your prices; we collect a platform fee
• **Payouts**: Payouts are processed according to our schedule
• **Compliance**: You must comply with all applicable laws

We reserve the right to remove products or suspend sellers who violate these terms.`,
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: `To the maximum extent permitted by law:

• We provide the platform "as is" without warranties
• We are not liable for indirect, incidental, or consequential damages
• Our total liability is limited to the amount you paid for the product in question
• We are not responsible for third-party products or seller conduct
• We do not guarantee uninterrupted or error-free service

Some jurisdictions do not allow limitation of liability, so some limitations may not apply to you.`,
  },
  {
    id: "modifications",
    title: "Modifications to Terms",
    content: `We may modify these terms at any time:

• Changes will be posted on this page
• Material changes will be notified via email
• Continued use after changes constitutes acceptance
• If you disagree with changes, you should discontinue use

We encourage you to review these terms periodically.`,
  },
  {
    id: "contact",
    title: "Contact Information",
    content: `For questions about these Terms & Conditions:

• **Email**: legal@digitalstore.com
• **Contact Form**: /contact
• **Response Time**: We aim to respond within 5 business days`,
  },
];

export default function TermsPage() {
  return (
    <>
      {/* Header */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg text-primary-200">
              Please read these terms carefully before using our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar TOC - Sticky on desktop */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <div className="card">
                  <h2 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted">
                    Contents
                  </h2>
                  <nav>
                    <ul className="space-y-2">
                      {sections.map((section, index) => (
                        <li key={section.id}>
                          <a
                            href={`#${section.id}`}
                            className="text-muted hover:text-accent transition-colors text-sm flex items-start gap-2"
                          >
                            <span className="text-xs text-primary-300 mt-0.5">
                              {index + 1}.
                            </span>
                            <span>{section.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="mb-12 scroll-mt-24"
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold">
                      {index + 1}
                    </span>
                    {section.title}
                  </h2>
                  <div className="text-muted whitespace-pre-line text-sm leading-relaxed">
                    {section.content}
                  </div>
                </div>
              ))}

              {/* Last Updated */}
              <div className="border-t border-border pt-8 mt-12">
                <p className="text-sm text-muted">Last updated: January 2026</p>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Link href="/products" className="btn-primary">
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
