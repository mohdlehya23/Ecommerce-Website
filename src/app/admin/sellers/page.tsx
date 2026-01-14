import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SellersTable } from "./SellersTable";

export const metadata: Metadata = {
  title: "Sellers Management | Admin",
  description: "Manage seller approvals and status",
};

export default async function AdminSellersPage() {
  const supabase = await createClient();

  // Get all sellers with product count
  const { data: sellers, error } = await supabase
    .from("sellers")
    .select(
      `
      *,
      products (count)
    `
    )
    .order("created_at", { ascending: false });

  // Transform data to include product count
  const sellersWithCount = sellers?.map((seller: any) => ({
    ...seller,
    _count: {
      products: seller.products?.[0]?.count || 0,
    },
  }));

  // Get counts by status
  const { count: totalCount } = await supabase
    .from("sellers")
    .select("*", { count: "exact", head: true });

  const { count: activeCount } = await supabase
    .from("sellers")
    .select("*", { count: "exact", head: true })
    .eq("seller_status", "active");

  const { count: pendingCount } = await supabase
    .from("sellers")
    .select("*", { count: "exact", head: true })
    .eq("seller_status", "pending");

  const { count: suspendedCount } = await supabase
    .from("sellers")
    .select("*", { count: "exact", head: true })
    .eq("seller_status", "suspended");

  return (
    <div className="container-wide">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sellers Management</h1>
        <p className="text-muted">
          Manage seller approvals and platform access
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Total Sellers</p>
          <p className="text-2xl font-bold">{totalCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {activeCount || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">
            {pendingCount || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Suspended</p>
          <p className="text-2xl font-bold text-red-600">
            {suspendedCount || 0}
          </p>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="card p-6">
        {error ? (
          <p className="text-center text-red-600 py-8">Error loading sellers</p>
        ) : !sellersWithCount || sellersWithCount.length === 0 ? (
          <p className="text-center text-muted py-8">No sellers found</p>
        ) : (
          <SellersTable initialSellers={sellersWithCount} />
        )}
      </div>
    </div>
  );
}
