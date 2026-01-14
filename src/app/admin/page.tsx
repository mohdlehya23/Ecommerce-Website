import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Dashboard | Digital Store",
  description: "Platform administration dashboard.",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch all stats in parallel for faster loading
  const [
    { count: userCount },
    { count: productCount },
    { count: orderCount },
    { count: sellerCount },
    { count: pendingSellerCount },
    { data: completedOrders },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("sellers").select("*", { count: "exact", head: true }),
    supabase
      .from("sellers")
      .select("*", { count: "exact", head: true })
      .eq("seller_status", "pending"),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "completed"),
  ]);

  const totalRevenue =
    completedOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted">Platform overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-accent">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Total Orders</p>
            <p className="text-3xl font-bold">{orderCount || 0}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Total Users</p>
            <p className="text-3xl font-bold">{userCount || 0}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Total Products</p>
            <p className="text-3xl font-bold">{productCount || 0}</p>
          </div>
        </div>

        {/* Pending Actions */}
        {(pendingSellerCount || 0) > 0 && (
          <div className="card p-6 mb-8 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-800">
                  Pending Approvals
                </h3>
                <p className="text-sm text-yellow-700">
                  {pendingSellerCount} seller application(s) awaiting review
                </p>
              </div>
              <Link
                href="/admin/sellers?status=pending"
                className="btn-primary"
              >
                Review Now
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold mb-4">Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/products"
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
                <p className="text-sm text-muted">
                  {productCount || 0} products
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/orders"
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Orders</h3>
                <p className="text-sm text-muted">{orderCount || 0} orders</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/sellers"
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Sellers</h3>
                <p className="text-sm text-muted">{sellerCount || 0} sellers</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/payouts"
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
                <p className="text-sm text-muted">Manage withdrawals</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <svg
                  className="w-6 h-6 text-orange-600"
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
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted">View reports</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Settings</h3>
                <p className="text-sm text-muted">Platform config</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
