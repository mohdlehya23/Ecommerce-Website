"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/products/ProductCard";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import type { Product } from "@/types";

const categories = [
  { id: "ebooks", label: "Ebooks" },
  { id: "templates", label: "Templates" },
  { id: "consulting", label: "Consulting" },
];

interface ProductsPageClientProps {
  initialProducts: Product[];
  initialCategory: string | null;
}

export function ProductsPageClient({
  initialProducts,
  initialCategory,
}: ProductsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  return (
    <div className="section-padding">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {selectedCategory
              ? `${
                  selectedCategory.charAt(0).toUpperCase() +
                  selectedCategory.slice(1)
                }`
              : "All Products"}
          </h1>
          <p className="text-muted max-w-2xl">
            {selectedCategory === "ebooks" &&
              "In-depth guides and resources to expand your knowledge and skills."}
            {selectedCategory === "templates" &&
              "Ready-to-use templates to jumpstart your projects and save time."}
            {selectedCategory === "consulting" &&
              "Expert guidance and personalized consulting for your specific needs."}
            {!selectedCategory &&
              "Browse our complete collection of premium digital products and services."}
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-8">
          <CategoryFilter categories={categories} />
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">No products found</h3>
            <p className="text-muted">
              {selectedCategory
                ? "No products available in this category yet."
                : "No products available yet. Check back soon!"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
