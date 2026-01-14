import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata: Metadata = {
  title: "Products Management | Admin",
  description: "Manage all marketplace products",
};

export default async function AdminProductsPage() {
  const supabase = await createClient();

  // Get all products with seller info
  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      *,
      sellers (
        username,
        display_name
      )
    `
    )
    .order("created_at", { ascending: false });

  // Get counts by status
  const { count: totalCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const { count: publishedCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: draftCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  const { count: archivedCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "archived");

  return (
    <div className="container-wide">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Products Management</h1>
        <p className="text-muted">View and manage all marketplace products</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Total Products</p>
          <p className="text-2xl font-bold">{totalCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Published</p>
          <p className="text-2xl font-bold text-green-600">
            {publishedCount || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Drafts</p>
          <p className="text-2xl font-bold text-gray-600">{draftCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted mb-1">Archived</p>
          <p className="text-2xl font-bold text-red-600">
            {archivedCount || 0}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="card p-6">
        {error ? (
          <p className="text-center text-red-600 py-8">
            Error loading products
          </p>
        ) : !products || products.length === 0 ? (
          <p className="text-center text-muted py-8">No products found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Product
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Seller
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Price (B2C)
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{product.title}</p>
                          <p className="text-xs text-muted line-clamp-1">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`/creators/${product.sellers?.username}`}
                        className="text-sm text-accent hover:underline"
                      >
                        {product.sellers?.display_name ||
                          product.sellers?.username ||
                          "Unknown"}
                      </Link>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm font-semibold">
                        ${product.price_b2c?.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge
                        status={product.status || "published"}
                        type="product"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs text-muted">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
