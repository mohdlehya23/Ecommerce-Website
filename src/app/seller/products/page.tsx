import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Products | Seller Dashboard",
  description: "Manage your product listings.",
};

export default async function SellerProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/products");
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

  // Get products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  const productList = products || [];

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <nav className="text-sm text-muted mb-2">
              <Link href="/seller" className="hover:text-accent">
                Dashboard
              </Link>
              <span className="mx-2">/</span>
              <span>Products</span>
            </nav>
            <h1 className="text-3xl font-bold">My Products</h1>
          </div>
          <Link href="/seller/products/new" className="btn-primary">
            + Add New Product
          </Link>
        </div>

        {/* Products List */}
        {productList.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-sm">
                    Product
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm">
                    Price
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {productList.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted capitalize">
                            {product.product_type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm capitalize hidden md:table-cell">
                      {product.category}
                    </td>
                    <td className="py-4 px-4 font-medium">
                      ${(product.price_b2c ?? 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          product.status === "published"
                            ? "bg-green-100 text-green-700"
                            : product.status === "draft"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-muted hover:text-foreground p-2"
                          title="View"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Link>
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="text-muted hover:text-accent p-2"
                          title="Edit"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
            <p className="text-muted mb-6">
              Start selling by adding your first product.
            </p>
            <Link href="/seller/products/new" className="btn-primary">
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
