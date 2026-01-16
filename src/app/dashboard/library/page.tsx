import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DownloadButton } from "@/components/dashboard/DownloadButton";
import type { OrderItem, Product, Order } from "@/types";

export const metadata: Metadata = {
  title: "My Library | Digital Store",
  description: "Access all your purchased digital products.",
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/library");
  }

  // Get all purchased products across completed orders
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      product:products (*),
      order:orders!inner (*)
    `
    )
    .eq("orders.user_id", user.id)
    .eq("orders.payment_status", "completed");

  // Group by category for filtering
  const items = (orderItems || []) as (OrderItem & {
    product: Product;
    order: Order;
  })[];

  const categories = Array.from(
    new Set(items.map((item) => item.product?.category).filter(Boolean))
  );

  return (
    <div className="section-padding">
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <nav className="text-sm text-muted mb-2">
              <Link href="/dashboard" className="hover:text-accent">
                Dashboard
              </Link>
              <span className="mx-2">/</span>
              <span>Library</span>
            </nav>
            <h1 className="text-3xl font-bold">My Library</h1>
            <p className="text-muted mt-1">
              {items.length} product{items.length !== 1 ? "s" : ""} in your
              library
            </p>
          </div>
          <Link href="/products" className="btn-primary text-sm">
            Browse More
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-accent">{items.length}</p>
            <p className="text-xs text-muted">Total Products</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-accent">
              {
                items.filter((i) => i.product?.product_type === "downloadable")
                  .length
              }
            </p>
            <p className="text-xs text-muted">Downloadable</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-accent">
              {items.filter((i) => i.license_type === "commercial").length}
            </p>
            <p className="text-xs text-muted">Commercial Licenses</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-accent">
              {categories.length}
            </p>
            <p className="text-xs text-muted">Categories</p>
          </div>
        </div>

        {/* Products Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="card group">
                {/* Product Image */}
                <div className="relative h-40 mb-4 rounded-lg overflow-hidden bg-gray-100">
                  {item.product?.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Category Badge */}
                  <span className="absolute top-2 left-2 text-xs px-2 py-1 bg-white/90 rounded-full capitalize">
                    {item.product?.category}
                  </span>
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 line-clamp-1">
                    {item.product?.title || "Product"}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.license_type === "commercial"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.license_type === "commercial"
                        ? "Commercial"
                        : "Personal"}{" "}
                      License
                    </span>
                  </div>
                  <p className="text-xs text-muted mb-4">
                    Purchased{" "}
                    {new Date(item.order.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  {item.product?.product_type === "downloadable" && (
                    <DownloadButton
                      orderId={item.order_id}
                      productId={item.product_id}
                      productTitle={item.product.title}
                    />
                  )}
                  <Link
                    href={`/dashboard/purchases/${item.order_id}`}
                    className="flex-1 btn-outline text-sm py-2 text-center"
                  >
                    View Receipt
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-muted"
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
            <h3 className="font-semibold text-lg mb-2">
              Your library is empty
            </h3>
            <p className="text-muted mb-6">
              Products you purchase will appear here for easy access.
            </p>
            <Link href="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
