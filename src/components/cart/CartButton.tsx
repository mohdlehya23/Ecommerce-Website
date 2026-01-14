"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

export function CartButton() {
  const { openCart, getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Only show cart count after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <button
      onClick={openCart}
      className="relative p-2 text-primary hover:text-accent transition-colors"
      aria-label="Open cart"
    >
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
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {mounted && totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-medium rounded-full flex items-center justify-center">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </button>
  );
}
