import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard | Digital Store",
  description: "View your orders, downloads, and manage your account.",
};

const navCards = [
  {
    title: "My Orders",
    description: "View order history and receipts",
    href: "/dashboard/orders",
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
    visibility: "all",
  },
  {
    title: "Library",
    description: "Access all your purchased products",
    href: "/dashboard/library",
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
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    visibility: "all",
  },
  {
    title: "Company Info",
    description: "Manage invoice details for your business",
    href: "/dashboard/company-info",
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
    visibility: "business",
  },
  {
    title: "Become a Seller",
    description: "Start selling your digital products",
    href: "/seller/apply",
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
    visibility: "all",
    highlight: true,
  },
  {
    title: "Seller Dashboard",
    description: "Manage your products and sales",
    href: "/seller",
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
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    visibility: "seller",
  },
  {
    title: "My Payouts",
    description: "View earnings and request withdrawals",
    href: "/seller/payouts",
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
    visibility: "seller",
  },
  {
    title: "Payout Settings",
    description: "Manage your payout email and settings",
    href: "/seller/payout-settings",
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
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    visibility: "seller",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  // Fetch all data in parallel
  const [
    { data: profile },
    { data: seller },
    { count: ordersCount },
    { count: productsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("sellers")
      .select("id, seller_status")
      .eq("id", user.id)
      .single(),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("order_items")
      .select("*, orders!inner(*)", { count: "exact", head: true })
      .eq("orders.user_id", user.id)
      .eq("orders.payment_status", "completed"),
  ]);

  const typedProfile = profile as Profile | null;
  const isSeller = !!seller;

  return (
    <div className="section-padding">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted">
            Welcome back, {typedProfile?.full_name || user.email}
          </p>
        </div>

        {/* Profile Card */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-accent">
                  {(typedProfile?.full_name || user.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  {typedProfile?.full_name || "User"}
                </h2>
                <p className="text-muted text-sm">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/20">
                    {typedProfile?.user_type === "business"
                      ? "Business Account"
                      : "Personal Account"}
                  </span>
                  {typedProfile?.email_confirmed ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
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
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/products" className="btn-outline text-sm py-2">
                Browse Products
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-bold text-accent">{ordersCount || 0}</p>
            <p className="text-sm text-muted">Total Orders</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-accent">
              {productsCount || 0}
            </p>
            <p className="text-sm text-muted">Products Owned</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-accent">
              {typedProfile?.user_type === "business" ? "B2B" : "B2C"}
            </p>
            <p className="text-sm text-muted">Account Type</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-accent">∞</p>
            <p className="text-sm text-muted">Downloads Left</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {navCards
            .filter((card) => {
              // Hide "Become a Seller" if already a seller
              if (card.href === "/seller/apply" && isSeller) return false;
              // Show seller-only cards only for sellers
              if (card.visibility === "seller") return isSeller;
              return (
                card.visibility === "all" ||
                (card.visibility === "business" &&
                  typedProfile?.user_type === "business")
              );
            })
            .map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="card hover:border-accent transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{card.title}</h3>
                    <p className="text-sm text-muted">{card.description}</p>
                  </div>
                </div>
              </Link>
            ))}
        </div>

        {/* Individual user hint for invoices */}
        {typedProfile?.user_type !== "business" && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                  Need invoices for your business?
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  You can generate invoices from any order receipt. For
                  VAT-compliant invoices with company details,{" "}
                  <Link href="/contact" className="underline">
                    upgrade to a business account
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
