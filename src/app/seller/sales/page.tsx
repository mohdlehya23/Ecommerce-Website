import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sales | Seller Dashboard",
  description: "View your sales and order history.",
};

export default async function SellerSalesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/sales");
  }

  // Get seller profile - id IS the user_id
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, seller_status")
    .eq("id", user.id)
    .single();

  // Allow sellers with active or payouts_locked status
  if (!seller || seller.seller_status === "suspended") {
    redirect("/seller");
  }

  // Get order items for this seller
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      order:orders(id, payment_status, created_at, buyer_email, buyer_name),
      product:products(title, slug, image_url)
    `
    )
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  const sales = orderItems || [];

  // Calculate totals
  const totalRevenue = sales.reduce((sum, item) => sum + (item.price || 0), 0);
  const completedSales = sales.filter(
    (item) => item.order?.payment_status === "completed"
  );

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted mb-2">
            <Link href="/seller" className="hover:text-accent">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <span>Sales</span>
          </nav>
          <h1 className="text-3xl font-bold">Sales</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-accent">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Total Sales</p>
            <p className="text-3xl font-bold">{sales.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {completedSales.length}
            </p>
          </div>
        </div>

        {/* Sales Table */}
        {sales.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-sm">
                    Product
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm hidden md:table-cell">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm">
                    Amount
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <p className="font-medium line-clamp-1">
                        {item.product?.title || "Product"}
                      </p>
                      <p className="text-xs text-muted capitalize">
                        {item.license_type} license
                      </p>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <p className="text-sm">{item.order?.buyer_name || "—"}</p>
                      <p className="text-xs text-muted">
                        {item.order?.buyer_email}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.order?.payment_status === "completed"
                            ? "bg-green-100 text-green-700"
                            : item.order?.payment_status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.order?.payment_status || "unknown"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted hidden lg:table-cell">
                      {item.order?.created_at
                        ? new Date(item.order.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-muted"
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
            <h3 className="text-xl font-semibold mb-2">No Sales Yet</h3>
            <p className="text-muted">
              Your sales will appear here once customers start purchasing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
