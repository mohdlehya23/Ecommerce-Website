import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = {
  title: "Add New Product | Seller Dashboard",
  description: "Create a new product listing.",
};

export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/products/new");
  }

  // Get seller profile - id IS the user_id
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, seller_status")
    .eq("id", user.id)
    .single();

  // Allow sellers with active or payouts_locked status
  if (!seller || seller.seller_status === "suspended") {
    redirect("/seller");
  }

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted mb-2">
            <Link href="/seller" className="hover:text-accent">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <Link href="/seller/products" className="hover:text-accent">
              Products
            </Link>
            <span className="mx-2">/</span>
            <span>New</span>
          </nav>
          <h1 className="text-3xl font-bold">Add New Product</h1>
        </div>

        {/* Form */}
        <div className="card">
          <ProductForm sellerId={seller.id} />
        </div>
      </div>
    </div>
  );
}
