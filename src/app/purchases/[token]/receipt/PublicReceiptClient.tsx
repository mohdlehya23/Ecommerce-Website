"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DownloadButton } from "@/components/dashboard/DownloadButton";
import type { Order, OrderItem, Product } from "@/types";

interface PublicReceiptClientProps {
  order: Order & {
    order_items: (OrderItem & { product: Product })[];
  };
  token: string;
}

export function PublicReceiptClient({
  order,
  token,
}: PublicReceiptClientProps) {
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already verified via cookie/session (handled by API check ideally,
  // but for now we'll do simple client flow or rely on API to return verified status)
  // For this implementation, we'll verify via API which sets a cookie

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/receipt/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      if (!response.ok) {
        throw new Error("Invalid email address");
      }

      setIsVerified(true);
    } catch (err) {
      setError("The email you entered does not match the purchase email.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  if (!isVerified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center section-padding bg-gray-50">
        <div className="card max-w-md w-full p-8 shadow-xl border-t-4 border-accent">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Access Your Purchase</h1>
            <p className="text-muted">
              Please enter the email address used for this purchase to view your
              receipt and downloads.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? "Verifying..." : "View Content"}
            </button>
          </form>

          <p className="text-xs text-center text-muted mt-6">
            Secure receipt access via Digital Store
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide max-w-3xl">
        {/* Receipt Header */}
        <div className="card mb-6 shadow-md border-t-4 border-accent">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Receipt</h1>
              <p className="text-sm text-muted">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                ${order.total_amount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-muted mb-1">Date</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-muted mb-1">Status</p>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                  statusColors[order.payment_status]
                }`}
              >
                {order.payment_status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-6">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
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
                        className="w-8 h-8"
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
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {item.product?.title}
                  </h3>
                  <p className="text-sm text-muted mb-3">
                    {item.license_type === "commercial"
                      ? "Commercial License"
                      : "Personal License"}
                  </p>

                  {order.payment_status === "completed" &&
                    item.product?.product_type === "downloadable" && (
                      <DownloadButton
                        orderId={order.id}
                        productId={item.product_id}
                        productTitle={item.product.title}
                        receiptToken={token} // Pass token for public auth
                        className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2"
                      />
                    )}
                </div>
                <div className="text-right font-medium">
                  ${item.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
            <Link
              href={`/purchases/${token}/invoice`}
              className="btn-outline text-sm py-2 px-4 inline-flex items-center gap-2"
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
              Generate Invoice
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-muted">
          Need help?{" "}
          <Link href="/contact" className="underline hover:text-accent">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
