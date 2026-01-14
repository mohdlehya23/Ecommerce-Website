import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Digital Store | Premium Digital Products & Services",
    template: "%s | Digital Store",
  },
  description:
    "Discover premium digital products and services. Ebooks, templates, and consulting for individuals and businesses.",
  keywords: [
    "digital products",
    "ebooks",
    "templates",
    "consulting",
    "B2B",
    "B2C",
  ],
  authors: [{ name: "Digital Store" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Digital Store",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cairo.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
