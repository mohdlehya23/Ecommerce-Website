"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product, licenseType: "personal" | "commercial") => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateLicenseType: (
    productId: string,
    licenseType: "personal" | "commercial"
  ) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  getTotalItems: () => number;
  getSubtotal: (userType: "individual" | "business") => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, licenseType) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) =>
              item.product.id === product.id &&
              item.license_type === licenseType
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id &&
                item.license_type === licenseType
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
              isOpen: true,
            };
          }

          return {
            items: [
              ...state.items,
              { product, quantity: 1, license_type: licenseType },
            ],
            isOpen: true,
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      updateLicenseType: (productId, licenseType) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId
              ? { ...item, license_type: licenseType }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: (userType) => {
        return get().items.reduce((total, item) => {
          const price =
            item.license_type === "commercial" || userType === "business"
              ? item.product.price_b2b
              : item.product.price_b2c;
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
