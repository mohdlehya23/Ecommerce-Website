"use client";

import Image from "next/image";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity, updateLicenseType } = useCartStore();
  const { profile } = useAuth();

  const price =
    item.license_type === "commercial" || profile?.user_type === "business"
      ? item.product.price_b2b
      : item.product.price_b2c;

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      {/* Product Image */}
      <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {item.product.image_url ? (
          <Image
            src={item.product.image_url}
            alt={item.product.title}
            fill
            sizes="80px"
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

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-primary truncate">
          {item.product.title}
        </h4>

        {/* License Type Toggle */}
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={() => updateLicenseType(item.product.id, "personal")}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
              item.license_type === "personal"
                ? "bg-accent text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => updateLicenseType(item.product.id, "commercial")}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
              item.license_type === "commercial"
                ? "bg-accent text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            Commercial
          </button>
        </div>

        {/* Quantity & Price */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
              className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span className="text-sm font-medium w-6 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-accent">
              ${(price * item.quantity).toFixed(2)}
            </span>
            <button
              onClick={() => removeItem(item.product.id)}
              className="text-muted hover:text-red-500 transition-colors"
              aria-label="Remove item"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
