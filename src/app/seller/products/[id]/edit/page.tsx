import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../../ProductForm";

export const metadata: Metadata = {
  title: "Edit Product | Seller Dashboard",
  description: "Update your product listing.",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/seller/products/${id}/edit`);
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

  // Get product
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("seller_id", seller.id)
    .single();

  if (error || !product) {
    notFound();
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
            <span>Edit</span>
          </nav>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted mt-1">{product.title}</p>
        </div>

        {/* Form */}
        <div className="card">
          <ProductForm sellerId={seller.id} product={product} />
        </div>

        {/* Danger Zone */}
        <div className="card mt-8 border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">
            Danger Zone
          </h3>
          <p className="text-sm text-muted mb-4">
            Deleting this product is permanent and cannot be undone.
          </p>
          <button className="btn-outline border-red-300 text-red-600 hover:bg-red-50">
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}
