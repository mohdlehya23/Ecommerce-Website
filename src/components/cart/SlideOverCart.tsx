"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { CartItem } from "@/components/cart/CartItem";

export function SlideOverCart() {
  const { items, isOpen, closeCart, getSubtotal, clearCart } = useCartStore();
  const { profile } = useAuth();

  const subtotal = getSubtotal(profile?.user_type || "individual");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-lg">
                Your Cart ({items.length})
              </h2>
              <button
                onClick={closeCart}
                className="p-2 text-muted hover:text-primary transition-colors"
                aria-label="Close cart"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <p className="text-muted mb-4">Your cart is empty</p>
                  <button
                    onClick={closeCart}
                    className="btn-primary text-sm py-2"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-0">
                  {items.map((item) => (
                    <CartItem key={item.product.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold text-lg">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {/* License Info */}
                <p className="text-xs text-muted">
                  {profile?.user_type === "business"
                    ? "Business pricing applied"
                    : "Switch items to Commercial license for business use"}
                </p>

                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="btn-primary w-full text-center"
                  >
                    Proceed to Checkout
                  </Link>
                  <button
                    onClick={clearCart}
                    className="w-full py-2 text-sm text-muted hover:text-red-500 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
