"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EmailConfirmationBanner } from "@/components/layout/EmailConfirmationBanner";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminArea = pathname?.startsWith("/admin") || false;

  return (
    <>
      {!isAdminArea && <EmailConfirmationBanner />}
      {!isAdminArea && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isAdminArea && <Footer />}
    </>
  );
}
