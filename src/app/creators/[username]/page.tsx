import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface CreatorPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("store_name, store_description")
    .eq("username", username)
    .eq("seller_status", "active")
    .eq("is_suspended", false)
    .single();

  if (!seller) {
    return { title: "Creator Not Found | Digital Store" };
  }

  return {
    title: `${seller.store_name} | Digital Store`,
    description:
      seller.store_description ||
      `Shop digital products from ${seller.store_name}`,
  };
}

export default async function CreatorStorefrontPage({
  params,
}: CreatorPageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get seller info (exclude suspended sellers)
  const { data: seller, error } = await supabase
    .from("sellers")
    .select(
      `
      *,
      profile:profiles(full_name, avatar_url)
    `
    )
    .eq("username", username)
    .eq("seller_status", "active")
    .eq("is_suspended", false)
    .single();

  if (error || !seller) {
    notFound();
  }

  // Get seller's products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", seller.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Get custom store pages
  const { data: storePages } = await supabase
    .from("store_pages")
    .select("id, title, slug")
    .eq("seller_id", seller.id)
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  const productList = products || [];
  const pageList = storePages || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Header */}
      <div
        className="relative h-64 md:h-80 bg-gradient-to-r from-accent to-primary"
        style={
          seller.banner_url
            ? {
                backgroundImage: `url(${seller.banner_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="container-wide relative z-10 h-full flex items-end pb-8">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
              {seller.logo_url || seller.profile?.avatar_url ? (
                <Image
                  src={seller.logo_url || seller.profile?.avatar_url}
                  alt={seller.store_name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent flex items-center justify-center text-white text-4xl font-bold">
                  {seller.store_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Info */}
            <div className="text-white pb-2">
              <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
                {seller.store_name}
              </h1>
              <p className="text-white/80 text-sm">@{username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="container-wide">
          <nav className="flex items-center gap-6 overflow-x-auto py-4">
            <Link
              href={`/creators/${username}`}
              className="text-sm font-medium text-accent border-b-2 border-accent pb-2 whitespace-nowrap"
            >
              Products
            </Link>
            {pageList.map((page) => (
              <Link
                key={page.id}
                href={`/creators/${username}/p/${page.slug}`}
                className="text-sm font-medium text-muted hover:text-foreground pb-2 whitespace-nowrap"
              >
                {page.title}
              </Link>
            ))}
            <Link
              href={`/creators/${username}/posts`}
              className="text-sm font-medium text-muted hover:text-foreground pb-2 whitespace-nowrap"
            >
              Posts
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-wide section-padding">
        {/* Bio */}
        {seller.store_description && (
          <p className="text-muted max-w-2xl mb-8">
            {seller.store_description}
          </p>
        )}

        {/* Products Grid */}
        {productList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productList.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group card hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative overflow-hidden rounded-t-xl bg-gray-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <svg
                        className="w-12 h-12"
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
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-accent transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-sm text-muted mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-accent">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted capitalize">
                      {product.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
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
            <p className="text-muted">
              This creator hasn&apos;t published any products yet. Check back
              soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
