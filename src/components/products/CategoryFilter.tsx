"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

interface CategoryFilterProps {
  categories: { id: string; label: string }[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("category");

  const updateCategory = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }

    // Use push to navigate so it updates the URL and history
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => updateCategory(null)}
        className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          selected === null
            ? "text-white"
            : "text-muted hover:text-primary bg-gray-100"
        }`}
      >
        <AnimatePresence>
          {selected === null && (
            <motion.div
              layoutId="categoryFilter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: "spring", duration: 0.3 }}
            />
          )}
        </AnimatePresence>
        <span className="relative z-10">All</span>
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => updateCategory(category.id)}
          className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            selected === category.id
              ? "text-white"
              : "text-muted hover:text-primary bg-gray-100"
          }`}
        >
          <AnimatePresence>
            {selected === category.id && (
              <motion.div
                layoutId="categoryFilter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: "spring", duration: 0.3 }}
              />
            )}
          </AnimatePresence>
          <span className="relative z-10">{category.label}</span>
        </button>
      ))}
    </div>
  );
}
