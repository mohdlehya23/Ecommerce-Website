"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { SlideOverCart } from "@/components/cart/SlideOverCart";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SlideOverCart />
    </AuthProvider>
  );
}
