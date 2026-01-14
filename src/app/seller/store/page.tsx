import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoreSettingsForm } from "./StoreSettingsForm";

export const metadata: Metadata = {
  title: "Store Settings | Seller Dashboard",
  description: "Customize your storefront.",
};

export default async function SellerStorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/store");
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
      <div className="container-wide max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted mb-2">
            <Link href="/seller" className="hover:text-accent">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <span>Store</span>
          </nav>
          <h1 className="text-3xl font-bold">Store Settings</h1>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href={`/creators/${seller.username}`}
            className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-accent"
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
            <div>
              <p className="font-medium">View Public Store</p>
              <p className="text-xs text-muted">
                See how customers see your store
              </p>
            </div>
          </Link>

          <Link
            href="/seller/store/pages"
            className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">Manage Pages</p>
              <p className="text-xs text-muted">Create custom store pages</p>
            </div>
          </Link>
        </div>

        {/* Settings Form */}
        <div className="card">
          <StoreSettingsForm seller={seller} />
        </div>
      </div>
    </div>
  );
}
