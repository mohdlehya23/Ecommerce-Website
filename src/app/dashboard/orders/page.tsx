import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, Product } from "@/types";
import { ResendReceiptButton } from "@/components/dashboard/ResendReceiptButton";

export const metadata: Metadata = {
  title: "My Orders | Digital Store",
  description: "View your order history and download receipts.",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/orders");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        product:products (*)
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

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
              <span>Orders</span>
            </nav>
            <h1 className="text-3xl font-bold">My Orders</h1>
          </div>
          <Link href="/products" className="btn-primary text-sm">
            Browse Products
          </Link>
        </div>

        {/* Orders List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const typedOrder = order as Order & {
                order_items: (OrderItem & { product: Product })[];
              };

              return (
                <div key={typedOrder.id} className="card">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">
                          Order #{typedOrder.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted">
                          {new Date(typedOrder.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {typedOrder.order_items.length} item
                          {typedOrder.order_items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Status & Amount */}
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[typedOrder.payment_status]
                        }`}
                      >
                        {typedOrder.payment_status.charAt(0).toUpperCase() +
                          typedOrder.payment_status.slice(1)}
                      </span>
                      <span className="font-bold text-lg">
                        ${typedOrder.total_amount.toFixed(2)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/purchases/${typedOrder.id}`}
                        className="btn-outline text-sm py-2 px-4"
                      >
                        View Receipt
                      </Link>
                      {typedOrder.payment_status === "completed" && (
                        <>
                          <a
                            href={`/api/invoice/${typedOrder.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline text-sm py-2 px-4"
                          >
                            Download Invoice
                          </a>
                          <ResendReceiptButton
                            orderId={typedOrder.id}
                            lastSentAt={typedOrder.last_receipt_sent_at}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {typedOrder.order_items.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                        >
                          {item.product?.title || "Product"}
                        </span>
                      ))}
                      {typedOrder.order_items.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          +{typedOrder.order_items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
            <p className="text-muted mb-6">
              You haven&apos;t made any purchases yet. Start exploring our
              products!
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
