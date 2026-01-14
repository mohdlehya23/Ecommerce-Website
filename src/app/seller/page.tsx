import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Seller Dashboard | Digital Store",
  description: "Manage your products, sales, and store.",
};

export default async function SellerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const params = await searchParams;
  const justApplied = params.applied === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller");
  }

  // Get seller profile - id IS the user_id (PK references auth.users)
  const { data: seller } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", user.id)
    .single();

  // If not a seller, show prompt to apply
  if (!seller) {
    return (
      <div className="section-padding">
        <div className="container-wide max-w-2xl">
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-accent"
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
            </div>
            <h1 className="text-2xl font-bold mb-3">Become a Seller</h1>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Start selling your digital products on our platform. Create your
              store, upload products, and reach customers worldwide.
            </p>
            <Link href="/seller/apply" className="btn-primary">
              Apply to Sell
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If seller is pending OR locked (just applied)
  if (seller.seller_status === "payouts_locked") {
    // Check if seller already has products (not first time)
    const { count: existingProductCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", seller.id);

    // If seller has products, redirect to products page
    if (existingProductCount && existingProductCount > 0) {
      redirect("/seller/products");
    }

    // If no products, show welcome screen for first-time sellers
    return (
      <div className="section-padding">
        <div className="container-wide max-w-2xl">
          {/* Success message for just applied */}
          {justApplied && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-green-600 flex-shrink-0"
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
                <div>
                  <p className="font-semibold text-green-800">
                    Application Submitted Successfully!
                  </p>
                  <p className="text-sm text-green-700">
                    Your seller account is now active. You can start adding
                    products right away!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-accent"
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
            </div>
            <h1 className="text-2xl font-bold mb-3">Welcome, Seller!</h1>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Your seller account is active! You can now add products and start
              selling. Payouts will be available once you complete your payout
              settings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/seller/products/new" className="btn-primary">
                Add Your First Product
              </Link>
              <Link href="/seller/payout-settings" className="btn-outline">
                Setup Payouts
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get stats
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", seller.id);

  const { data: salesData } = await supabase
    .from("order_items")
    .select("price")
    .eq("seller_id", seller.id);

  const totalSales =
    salesData?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
  const orderCount = salesData?.length || 0;

  // Get pending payout
  const { data: pendingPayout } = await supabase
    .from("payouts")
    .select("amount")
    .eq("seller_id", seller.id)
    .eq("status", "pending");

  const pendingAmount =
    pendingPayout?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Seller Dashboard</h1>
            <p className="text-muted">Welcome back, {seller.store_name}</p>
          </div>
          <Link
            href={`/creators/${seller.username}`}
            className="btn-outline mt-4 md:mt-0"
          >
            View Public Store →
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Total Sales</p>
            <p className="text-3xl font-bold text-accent">
              ${totalSales.toFixed(2)}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Orders</p>
            <p className="text-3xl font-bold">{orderCount}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Products</p>
            <p className="text-3xl font-bold">{productCount || 0}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Pending Payout</p>
            <p className="text-3xl font-bold text-green-600">
              ${pendingAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/seller/products"
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Products</h3>
                <p className="text-sm text-muted">Manage your listings</p>
              </div>
            </div>
          </Link>

          <Link
            href="/seller/sales"
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
              <div>
                <h3 className="font-semibold">Sales</h3>
                <p className="text-sm text-muted">View order history</p>
              </div>
            </div>
          </Link>

          <Link
            href="/seller/store"
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg
                  className="w-6 h-6 text-purple-600"
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
              <div>
                <h3 className="font-semibold">Store</h3>
                <p className="text-sm text-muted">Customize your storefront</p>
              </div>
            </div>
          </Link>

          <Link
            href="/seller/payouts"
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              </div>
              <div>
                <h3 className="font-semibold">Payouts</h3>
                <p className="text-sm text-muted">Earnings & withdrawals</p>
              </div>
            </div>
          </Link>

          <Link
            href="/seller/products/new"
            className="card p-6 hover:shadow-lg transition-shadow group border-2 border-dashed border-accent/30 hover:border-accent"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-accent">New Product</h3>
                <p className="text-sm text-muted">Add a new listing</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
