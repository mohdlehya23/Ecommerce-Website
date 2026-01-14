import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Store Pages | Seller Dashboard",
  description: "Manage your custom store pages.",
};

export default async function SellerPagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/store/pages");
  }

  // Get seller profile - id IS the user_id
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, seller_status, username")
    .eq("id", user.id)
    .single();

  // Allow sellers with active or payouts_locked status
  if (!seller || seller.seller_status === "suspended") {
    redirect("/seller");
  }

  // Get store pages
  const { data: pages } = await supabase
    .from("store_pages")
    .select("*")
    .eq("seller_id", seller.id)
    .order("display_order", { ascending: true });

  const pageList = pages || [];

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <nav className="text-sm text-muted mb-2">
              <Link href="/seller" className="hover:text-accent">
                Dashboard
              </Link>
              <span className="mx-2">/</span>
              <Link href="/seller/store" className="hover:text-accent">
                Store
              </Link>
              <span className="mx-2">/</span>
              <span>Pages</span>
            </nav>
            <h1 className="text-3xl font-bold">Store Pages</h1>
          </div>
          <Link href="/seller/store/pages/new" className="btn-primary">
            + New Page
          </Link>
        </div>

        {/* Pages List */}
        {pageList.length > 0 ? (
          <div className="space-y-4">
            {pageList.map((page) => (
              <div
                key={page.id}
                className="card p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium">{page.title}</h3>
                  <p className="text-sm text-muted">
                    /creators/{seller.username}/p/{page.slug}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      page.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {page.is_published ? "Published" : "Draft"}
                  </span>
                  <Link
                    href={`/seller/store/pages/${page.id}`}
                    className="btn-outline text-sm py-2 px-3"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Pages Yet</h3>
            <p className="text-muted mb-6">
              Create custom pages for your store like About, FAQ, or Portfolio.
            </p>
            <Link href="/seller/store/pages/new" className="btn-primary">
              Create Your First Page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
