"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { PricingToggle } from "@/components/products/PricingToggle";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const { addItem } = useCartStore();
  const { profile } = useAuth();
  const [licenseType, setLicenseType] = useState<"personal" | "commercial">(
    profile?.user_type === "business" ? "commercial" : "personal"
  );

  const price =
    licenseType === "commercial" ? product.price_b2b : product.price_b2c;

  const categoryColors = {
    ebooks: "bg-blue-100 text-blue-700",
    templates: "bg-purple-100 text-purple-700",
    consulting: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="section-padding">
      <div className="container-wide">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="text-muted hover:text-primary">
                Home
              </Link>
            </li>
            <li className="text-muted">/</li>
            <li>
              <Link href="/products" className="text-muted hover:text-primary">
                Products
              </Link>
            </li>
            <li className="text-muted">/</li>
            <li>
              <Link
                href={`/products?category=${product.category}`}
                className="text-muted hover:text-primary capitalize"
              >
                {product.category}
              </Link>
            </li>
            <li className="text-muted">/</li>
            <li className="text-primary font-medium truncate max-w-[200px]">
              {product.title}
            </li>
          </ol>
        </nav>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <svg
                    className="w-24 h-24"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                    categoryColors[product.category]
                  }`}
                >
                  {product.category.charAt(0).toUpperCase() +
                    product.category.slice(1)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted">
                {product.product_type === "virtual" ? "Service" : "Download"}
              </span>
              {product.product_type === "downloadable" && (
                <span className="flex items-center gap-1 text-xs text-accent">
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Instant Download
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {product.title}
            </h1>

            {product.description && (
              <p className="text-muted text-lg mb-6 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* License Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                License Type
              </label>
              <PricingToggle value={licenseType} onChange={setLicenseType} />
              <p className="text-sm text-muted mt-2">
                {licenseType === "personal"
                  ? "For personal, non-commercial use only."
                  : "Includes commercial usage rights for businesses."}
              </p>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-accent">
                  ${price.toFixed(2)}
                </span>
                {licenseType === "commercial" &&
                  product.price_b2c !== product.price_b2b && (
                    <span className="text-lg text-muted line-through">
                      ${product.price_b2c.toFixed(2)}
                    </span>
                  )}
              </div>
              {profile?.user_type === "business" && (
                <p className="text-sm text-accent mt-1">
                  Business pricing applied
                </p>
              )}
            </div>

            {/* Add to Cart */}
            <button
              onClick={() => addItem(product, licenseType)}
              className="btn-primary text-lg py-4 mb-4"
            >
              Add to Cart
            </button>

            {/* Features */}
            <div className="border-t border-border pt-6 mt-auto">
              <h3 className="font-semibold mb-4">What&apos;s Included</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-accent flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {product.product_type === "downloadable"
                    ? "Instant digital download"
                    : "Priority scheduling"}
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-accent flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Lifetime access
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-accent flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Free updates
                </li>
                {licenseType === "commercial" && (
                  <li className="flex items-center gap-3 text-sm">
                    <svg
                      className="w-5 h-5 text-accent flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Commercial usage rights
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((relatedProduct, index) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
