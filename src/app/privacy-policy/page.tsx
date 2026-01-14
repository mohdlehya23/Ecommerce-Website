import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Digital Store",
  description:
    "Learn how we collect, use, and protect your personal information when you use our digital marketplace.",
};

const sections = [
  {
    id: "information-collection",
    title: "Information We Collect",
    content: `We collect information you provide directly to us, including:
    
• **Account Information**: Name, email address, password, and account preferences when you create an account.
• **Payment Information**: Billing details processed securely through PayPal. We do not store your complete payment card information.
• **Purchase History**: Records of products you've purchased for order fulfillment and support.
• **Communication Data**: Messages you send us through contact forms or support channels.
• **Business Information**: Company name, VAT/Tax ID, and address for B2B accounts.`,
  },
  {
    id: "information-use",
    title: "How We Use Your Information",
    content: `We use the information we collect to:

• Process your orders and deliver digital products
• Send order confirmations and download links
• Provide customer support and respond to inquiries
• Send important account notifications
• Improve our services and user experience
• Comply with legal obligations
• Prevent fraud and abuse`,
  },
  {
    id: "data-sharing",
    title: "Information Sharing",
    content: `We do not sell your personal information. We may share your information only in these circumstances:

• **Payment Processors**: With PayPal to process your payments securely
• **Sellers**: With product creators for order fulfillment and support
• **Legal Requirements**: When required by law or to protect our rights
• **Business Transfers**: In connection with a merger or acquisition`,
  },
  {
    id: "data-security",
    title: "Data Security",
    content: `We implement appropriate security measures to protect your personal information:

• Encryption of data in transit (HTTPS/TLS)
• Secure authentication with Supabase Auth
• Row Level Security (RLS) ensuring data isolation between users
• Signed download URLs that expire after 1 hour
• Regular security audits and updates`,
  },
  {
    id: "cookies",
    title: "Cookies and Tracking",
    content: `We use essential cookies to:

• Maintain your login session
• Remember your preferences
• Ensure security of our platform

We do not use third-party advertising cookies or sell data to advertisers.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: `You have the right to:

• **Access**: Request a copy of your personal data
• **Correction**: Update or correct your information
• **Deletion**: Request deletion of your account and data
• **Portability**: Export your data in a common format
• **Opt-out**: Unsubscribe from marketing communications

To exercise these rights, contact us at privacy@digitalstore.com`,
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: `We retain your data for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information as required by law or for legitimate business purposes (e.g., transaction records for tax purposes).`,
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    content: `Our services are not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a minor, please contact us immediately.`,
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.`,
  },
  {
    id: "contact",
    title: "Contact Us",
    content: `If you have questions about this Privacy Policy or our data practices, please contact us:

• **Email**: privacy@digitalstore.com
• **Contact Form**: /contact

We aim to respond to all privacy-related inquiries within 30 days.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Header */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-primary-200">
              Your privacy matters to us. Learn how we collect, use, and protect
              your information.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            {/* Table of Contents */}
            <div className="card mb-12">
              <h2 className="font-bold mb-4">Table of Contents</h2>
              <nav>
                <ul className="space-y-2">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-muted hover:text-accent transition-colors text-sm flex items-center gap-2"
                      >
                        <span className="text-xs text-primary-300">
                          {index + 1}.
                        </span>
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Sections */}
            <div className="prose max-w-none">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="mb-10 scroll-mt-24"
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
            </div>

            {/* Last Updated */}
            <div className="border-t border-border pt-8 mt-12">
              <p className="text-sm text-muted text-center">
                Last updated: January 2026
              </p>
            </div>

            {/* CTA */}
            <div className="text-center mt-8">
              <Link href="/products" className="btn-primary">
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
