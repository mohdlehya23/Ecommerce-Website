import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata: Metadata = {
  title: "Orders Management | Admin",
  description: "Manage all marketplace orders",
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  // Fetch all data in parallel for faster loading
  const [
    { data: orders, error },
    { count: totalCount },
    { count: completedCount },
    { count: pendingCount },
    { data: completedOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "completed"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "pending"),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "completed"),
  ]);

  const totalRevenue =
    completedOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

  return (
    <div className="container-wide">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
        <p className="text-muted">View and track all marketplace orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{totalCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {completedCount || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {pendingCount || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-accent">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card p-6">
        {error ? (
          <p className="text-center text-red-600 py-8">Error loading orders</p>
        ) : !orders || orders.length === 0 ? (
          <p className="text-center text-muted py-8">No orders found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Customer
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {order.id.substring(0, 8)}
                      </code>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm font-medium">
                          {order.user_id?.substring(0, 8) || "Guest"}
                        </p>
                        <p className="text-xs text-muted">Customer ID</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm font-semibold">
                        ${order.total_amount?.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge
                        status={order.payment_status}
                        type="payment"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs text-muted">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
