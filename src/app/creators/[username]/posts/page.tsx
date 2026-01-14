import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PostsPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PostsPageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("store_name")
    .eq("username", username)
    .eq("status", "approved")
    .single();

  if (!seller) {
    return { title: "Creator Not Found | Digital Store" };
  }

  return {
    title: `Posts | ${seller.store_name}`,
    description: `Updates and announcements from ${seller.store_name}`,
  };
}

export default async function CreatorPostsPage({ params }: PostsPageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get seller info
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, store_name, logo_url")
    .eq("username", username)
    .eq("status", "approved")
    .single();

  if (!seller) {
    notFound();
  }

  // Get custom store pages for nav
  const { data: storePages } = await supabase
    .from("store_pages")
    .select("id, title, slug")
    .eq("seller_id", seller.id)
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  const pageList = storePages || [];

  // For now, posts would come from a posts table (not yet created)
  // This is a placeholder for the posts feature
  const posts: Array<{
    id: string;
    title: string;
    excerpt: string;
    created_at: string;
  }> = [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-wide py-4">
          <Link
            href={`/creators/${username}`}
            className="inline-flex items-center gap-2 text-muted hover:text-accent"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">{seller.store_name}</span>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="container-wide">
          <nav className="flex items-center gap-6 overflow-x-auto py-4">
            <Link
              href={`/creators/${username}`}
              className="text-sm font-medium text-muted hover:text-foreground pb-2 whitespace-nowrap"
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
              className="text-sm font-medium text-accent border-b-2 border-accent pb-2 whitespace-nowrap"
            >
              Posts
            </Link>
          </nav>
        </div>
      </div>

      {/* Posts Content */}
      <div className="container-wide section-padding max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Posts</h1>

        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="card p-6">
                <div className="flex items-center gap-2 text-sm text-muted mb-2">
                  <time>
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-muted">{post.excerpt}</p>
              </article>
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
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
            <p className="text-muted">
              {seller.store_name} hasn&apos;t published any posts yet. Check
              back for updates!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
