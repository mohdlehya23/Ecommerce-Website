import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductsPageClient } from "./ProductsPageClient";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our collection of premium digital products including ebooks, templates, and consulting services.",
};

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { category } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (category && ["ebooks", "templates", "consulting"].includes(category)) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  const products = (data as Product[]) || [];

  return (
    <ProductsPageClient
      initialProducts={products}
      initialCategory={category || null}
    />
  );
}
