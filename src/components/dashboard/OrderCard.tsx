"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Order, OrderItem, Product } from "@/types";
import { DownloadButton } from "./DownloadButton";

interface OrderCardProps {
  order: Order & {
    order_items: (OrderItem & { product: Product })[];
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="card">
      {/* Order Header */}
      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
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
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-sm text-muted">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[order.payment_status]
            }`}
          >
            {order.payment_status.charAt(0).toUpperCase() +
              order.payment_status.slice(1)}
          </span>
          <span className="font-bold text-lg">
            ${order.total_amount.toFixed(2)}
          </span>
          <svg
            className={`w-5 h-5 text-muted transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Order Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border mt-4 pt-4 space-y-4">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-white flex-shrink-0">
                    {item.product?.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.title}
                        fill
                        sizes="64px"
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
                  <div className="text-right">
                    <p className="font-semibold">${item.price.toFixed(2)}</p>
                  </div>

                  {/* Download Button */}
                  {order.payment_status === "completed" &&
                    item.product?.product_type === "downloadable" && (
                      <DownloadButton
                        orderId={order.id}
                        productId={item.product_id}
                        productTitle={item.product.title}
                      />
                    )}
                </div>
              ))}
            </div>

            {/* Invoice Download - shown for all completed orders */}
            {order.payment_status === "completed" && (
              <div className="border-t border-border mt-4 pt-4 flex justify-end">
                <a
                  href={`/api/invoice/${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-sm py-2 px-4 flex items-center gap-2"
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
                  Download Invoice
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
