import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Getting Paid | Seller Dashboard",
  description: "Learn how payouts work.",
};

export default async function GettingPaidPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/getting-paid");
  }

  // Get seller profile - id IS the user_id
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, seller_status, payout_email")
    .eq("id", user.id)
    .single();

  // Allow sellers with active or payouts_locked status
  if (!seller || seller.seller_status === "suspended") {
    redirect("/seller");
  }

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted mb-2">
            <Link href="/seller" className="hover:text-accent">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <span>Getting Paid</span>
          </nav>
          <h1 className="text-3xl font-bold">Getting Paid</h1>
        </div>

        {/* Payout Email Check */}
        {!seller.payout_email && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-8">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
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
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Payout Email Required
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  You need to set up your payout email before you can receive
                  payments.
                </p>
                <Link
                  href="/seller/payout-settings"
                  className="text-sm text-yellow-800 underline mt-2 inline-block"
                >
                  Set up now →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-8">
          {/* How it Works */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">How Payouts Work</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Make Sales</h3>
                  <p className="text-sm text-muted">
                    When customers purchase your products, the earnings are
                    added to your balance.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Reach Threshold</h3>
                  <p className="text-sm text-muted">
                    Once your available balance reaches $10, you can request a
                    payout.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Get Paid</h3>
                  <p className="text-sm text-muted">
                    Payouts are processed within 3-5 business days to your
                    PayPal account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Platform Fees</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-accent">10%</p>
                <p className="text-sm text-muted">Platform Fee</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">90%</p>
                <p className="text-sm text-muted">You Keep</p>
              </div>
            </div>
            <p className="text-sm text-muted mt-4">
              We charge a simple 10% platform fee on each sale. No hidden fees,
              no monthly charges.
            </p>
          </div>

          {/* FAQ */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">When do I get paid?</h3>
                <p className="text-sm text-muted">
                  You can request a payout anytime once your balance reaches
                  $10. Payouts are processed within 3-5 business days.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  What payment methods are supported?
                </h3>
                <p className="text-sm text-muted">
                  Currently we support PayPal for payouts. Bank transfers are
                  coming soon.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Are there any payout fees?</h3>
                <p className="text-sm text-muted">
                  We don&apos;t charge payout fees. However, PayPal may charge
                  their standard receiving fees.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-4">
            <Link href="/seller/payouts" className="btn-primary">
              View My Payouts
            </Link>
            <Link href="/seller/payout-settings" className="btn-outline">
              Payout Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
