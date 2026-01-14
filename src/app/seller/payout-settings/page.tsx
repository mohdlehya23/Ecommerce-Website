import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PayoutSettingsForm } from "./PayoutSettingsForm";

export const metadata: Metadata = {
  title: "Payout Settings | Seller Dashboard",
  description: "Configure your payout preferences.",
};

export default async function PayoutSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/payout-settings");
  }

  // Get seller profile - id IS the user_id
  const { data: seller } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", user.id)
    .single();

  // Allow sellers with active or payouts_locked status
  if (!seller || seller.seller_status === "suspended") {
    redirect("/seller");
  }

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted mb-2">
            <Link href="/seller" className="hover:text-accent">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <Link href="/seller/payouts" className="hover:text-accent">
              Payouts
            </Link>
            <span className="mx-2">/</span>
            <span>Settings</span>
          </nav>
          <h1 className="text-3xl font-bold">Payout Settings</h1>
        </div>

        {/* Info Alert */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <div>
              <p className="text-sm font-medium text-blue-800">
                Payout Information
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Payouts are processed via PayPal. Ensure your PayPal email is
                correct to receive payments. Minimum payout threshold is $10.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <PayoutSettingsForm seller={seller} />
        </div>
      </div>
    </div>
  );
}
