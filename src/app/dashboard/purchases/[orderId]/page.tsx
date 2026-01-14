import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DownloadButton } from "@/components/dashboard/DownloadButton";
import { ResendReceiptButton } from "@/components/dashboard/ResendReceiptButton";
import type { Order, OrderItem, Product } from "@/types";

export const metadata: Metadata = {
  title: "Receipt | Digital Store",
  description: "View your purchase receipt and download your products.",
};

interface PurchasePageProps {
  params: Promise<{ orderId: string }>;
}

export default async function PurchasePage({ params }: PurchasePageProps) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/dashboard/purchases/${orderId}`);
  }

  const { data: order, error } = await supabase
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
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    notFound();
  }

  const typedOrder = order as Order & {
    order_items: (OrderItem & { product: Product })[];
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="section-padding">
      <div className="container-wide max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted mb-2">
            <Link href="/dashboard" className="hover:text-accent">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <Link href="/dashboard/orders" className="hover:text-accent">
              Orders
            </Link>
            <span className="mx-2">/</span>
            <span>Receipt</span>
          </nav>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              Receipt for Order #{typedOrder.id.slice(0, 8).toUpperCase()}
            </h1>
            {typedOrder.payment_status === "completed" && (
              <ResendReceiptButton
                orderId={typedOrder.id}
                lastSentAt={typedOrder.last_receipt_sent_at}
              />
            )}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted mb-1">Order Date</p>
              <p className="font-medium">
                {new Date(typedOrder.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Status</p>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[typedOrder.payment_status]
                }`}
              >
                {typedOrder.payment_status.charAt(0).toUpperCase() +
                  typedOrder.payment_status.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Total Amount</p>
              <p className="font-bold text-lg">
                ${typedOrder.total_amount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Transaction ID</p>
              <p className="font-mono text-sm truncate">
                {typedOrder.paypal_order_id?.slice(0, 12) || "N/A"}...
              </p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Order Items</h2>
          <div className="divide-y divide-border">
            {typedOrder.order_items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product?.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
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
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product?.slug}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {item.product?.title || "Product"}
                    </Link>
                    <p className="text-sm text-muted">
                      {item.license_type === "commercial"
                        ? "Commercial License"
                        : "Personal License"}
                    </p>
                  </div>

                  {/* Price */}
                  <p className="font-semibold">${item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">
              ${typedOrder.total_amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Downloads Section */}
        {typedOrder.payment_status === "completed" && (
          <div className="card mb-6">
            <h2 className="font-semibold mb-4">Downloads</h2>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-blue-700">
                <svg
                  className="w-4 h-4"
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
                <p className="text-sm">
                  Download links are valid for 1 hour. You can generate new
                  links anytime.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {typedOrder.order_items
                .filter((item) => item.product?.product_type === "downloadable")
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-sm">
                      {item.product?.title}
                    </span>
                    <DownloadButton
                      orderId={typedOrder.id}
                      productId={item.product_id}
                      productTitle={item.product?.title || "Download"}
                    />
                  </div>
                ))}
              {typedOrder.order_items.every(
                (item) => item.product?.product_type !== "downloadable"
              ) && (
                <p className="text-muted text-sm text-center py-4">
                  No downloadable files in this order.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Invoice Section */}
        {typedOrder.payment_status === "completed" && (
          <div className="card">
            <h2 className="font-semibold mb-4">Invoice</h2>
            <p className="text-sm text-muted mb-4">
              Generate or view the invoice for this order. The invoice will
              include your account details.
            </p>
            <Link
              href={`/dashboard/invoice/${typedOrder.id}`}
              className="btn-outline inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Invoice
            </Link>
          </div>
        )}

        {/* Payment Pending/Failed Message */}
        {typedOrder.payment_status !== "completed" && (
          <div
            className={`card ${
              typedOrder.payment_status === "pending"
                ? "bg-yellow-50"
                : "bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <svg
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  typedOrder.payment_status === "pending"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
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
              <div>
                <p
                  className={`font-medium ${
                    typedOrder.payment_status === "pending"
                      ? "text-yellow-800"
                      : "text-red-800"
                  }`}
                >
                  {typedOrder.payment_status === "pending"
                    ? "Payment Pending"
                    : "Payment Failed"}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    typedOrder.payment_status === "pending"
                      ? "text-yellow-700"
                      : "text-red-700"
                  }`}
                >
                  {typedOrder.payment_status === "pending"
                    ? "Your payment is being processed. Downloads will be available once payment is confirmed."
                    : "There was an issue with your payment. Please contact support if you believe this is an error."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
