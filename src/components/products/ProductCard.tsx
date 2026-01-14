"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { profile } = useAuth();

  const price =
    profile?.user_type === "business" ? product.price_b2b : product.price_b2c;

  const categoryColors = {
    ebooks: "bg-blue-100 text-blue-700",
    templates: "bg-purple-100 text-purple-700",
    consulting: "bg-amber-100 text-amber-700",
  };

  const productTypeIcons = {
    virtual: (
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
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
    downloadable: (
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
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group card overflow-hidden"
    >
      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative h-48 -mx-6 -mt-6 mb-4 bg-gray-100 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index === 0}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <svg
                className="w-16 h-16"
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
          <div className="absolute top-3 left-3">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                categoryColors[product.category]
              }`}
            >
              {product.category.charAt(0).toUpperCase() +
                product.category.slice(1)}
            </span>
          </div>

          {/* Product Type Badge */}
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-muted">
              {productTypeIcons[product.product_type]}
              {product.product_type === "virtual" ? "Service" : "Download"}
            </span>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <Link href={`/products/${product.slug}`} className="block">
        <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors line-clamp-2">
          {product.title}
        </h3>
      </Link>

      {product.description && (
        <p className="text-muted text-sm line-clamp-2 mb-4">
          {product.description}
        </p>
      )}

      {/* Price & Action */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
        <div>
          <span className="text-2xl font-bold text-accent">
            ${price.toFixed(2)}
          </span>
          {profile?.user_type === "business" && (
            <span className="text-xs text-muted ml-2">B2B</span>
          )}
        </div>

        <button
          onClick={() =>
            addItem(
              product,
              profile?.user_type === "business" ? "commercial" : "personal"
            )
          }
          className="btn-primary text-sm py-2 px-4"
        >
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
