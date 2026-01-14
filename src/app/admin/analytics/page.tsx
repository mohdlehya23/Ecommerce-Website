import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Analytics | Admin",
  description: "Platform analytics and insights",
};

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // KPI Data
  const { data: completedOrders } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("payment_status", "completed");

  const totalRevenue =
    completedOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

  const { count: ordersThisMonth } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(new Date().setDate(1)).toISOString())
    .eq("payment_status", "completed");

  const { count: activeSellers } = await supabase
    .from("sellers")
    .select("*", { count: "exact", head: true })
    .eq("seller_status", "active");

  const { data: orderItems } = await supabase.from("order_items").select("id");

  const productsSold = orderItems?.length || 0;

  // Top Sellers
  const { data: topSellers } = await supabase.from("order_items").select(`
      seller_id,
      price,
      sellers (username, display_name)
    `);

  const sellerRevenue: Record<string, { name: string; revenue: number }> = {};
  topSellers?.forEach((item: any) => {
    const sellerId = item.seller_id;
    if (!sellerId) return;
    if (!sellerRevenue[sellerId]) {
      sellerRevenue[sellerId] = {
        name: item.sellers?.display_name || item.sellers?.username || "Unknown",
        revenue: 0,
      };
    }
    sellerRevenue[sellerId].revenue += item.price || 0;
  });

  const topSellersArray = Object.entries(sellerRevenue)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top Products
  const { data: topProducts } = await supabase.from("order_items").select(`
      product_id,
      price,
      products (title)
    `);

  const productSales: Record<
    string,
    { title: string; count: number; revenue: number }
  > = {};
  topProducts?.forEach((item: any) => {
    const productId = item.product_id;
    if (!productId) return;
    if (!productSales[productId]) {
      productSales[productId] = {
        title: item.products?.title || "Unknown",
        count: 0,
        revenue: 0,
      };
    }
    productSales[productId].count++;
    productSales[productId].revenue += item.price || 0;
  });

  const topProductsArray = Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="container-wide">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
        <p className="text-muted">Insights and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-accent">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Orders This Month</p>
          <p className="text-3xl font-bold">{ordersThisMonth || 0}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Active Sellers</p>
          <p className="text-3xl font-bold">{activeSellers || 0}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted mb-1">Products Sold</p>
          <p className="text-3xl font-bold">{productsSold}</p>
        </div>
      </div>

      {/* Top Sellers & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Top Sellers by Revenue</h2>
          {topSellersArray.length === 0 ? (
            <p className="text-muted text-sm">No data available</p>
          ) : (
            <div className="space-y-3">
              {topSellersArray.map((seller, index) => (
                <div
                  key={seller.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium">{seller.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-accent">
                    ${seller.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Top Products by Sales</h2>
          {topProductsArray.length === 0 ? (
            <p className="text-muted text-sm">No data available</p>
          ) : (
            <div className="space-y-3">
              {topProductsArray.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium line-clamp-1">
                      {product.title}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {product.count} sales
                    </p>
                    <p className="text-xs text-muted">
                      ${product.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
