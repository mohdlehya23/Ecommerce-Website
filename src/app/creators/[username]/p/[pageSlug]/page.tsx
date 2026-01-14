import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface CustomPageProps {
  params: Promise<{ username: string; pageSlug: string }>;
}

export async function generateMetadata({
  params,
}: CustomPageProps): Promise<Metadata> {
  const { username, pageSlug } = await params;
  const supabase = await createClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, store_name")
    .eq("username", username)
    .eq("status", "approved")
    .single();

  if (!seller) {
    return { title: "Page Not Found | Digital Store" };
  }

  const { data: page } = await supabase
    .from("store_pages")
    .select("title, meta_description")
    .eq("seller_id", seller.id)
    .eq("slug", pageSlug)
    .eq("is_published", true)
    .single();

  if (!page) {
    return { title: "Page Not Found | Digital Store" };
  }

  return {
    title: `${page.title} | ${seller.store_name}`,
    description:
      page.meta_description || `${page.title} - ${seller.store_name}`,
  };
}

export default async function CreatorCustomPage({ params }: CustomPageProps) {
  const { username, pageSlug } = await params;
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

  // Get the page
  const { data: page, error } = await supabase
    .from("store_pages")
    .select(
      `
      *,
      sections:page_sections(*)
    `
    )
    .eq("seller_id", seller.id)
    .eq("slug", pageSlug)
    .eq("is_published", true)
    .single();

  if (error || !page) {
    notFound();
  }

  // Get other pages for nav
  const { data: storePages } = await supabase
    .from("store_pages")
    .select("id, title, slug")
    .eq("seller_id", seller.id)
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  const pageList = storePages || [];
  const sections = page.sections || [];

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
            {pageList.map((p) => (
              <Link
                key={p.id}
                href={`/creators/${username}/p/${p.slug}`}
                className={`text-sm font-medium pb-2 whitespace-nowrap ${
                  p.slug === pageSlug
                    ? "text-accent border-b-2 border-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {p.title}
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

      {/* Page Content */}
      <div className="container-wide section-padding max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{page.title}</h1>

        {/* Render sections */}
        <div className="space-y-8">
          {sections.length > 0 ? (
            sections
              .sort(
                (a: { display_order: number }, b: { display_order: number }) =>
                  a.display_order - b.display_order
              )
              .map(
                (section: {
                  id: string;
                  section_type: string;
                  content: Record<string, unknown>;
                }) => (
                  <div key={section.id} className="prose prose-lg max-w-none">
                    {section.section_type === "text" && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            (section.content as { html?: string })?.html || "",
                        }}
                      />
                    )}
                    {section.section_type === "image" && (
                      <figure>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={(section.content as { url?: string })?.url}
                          alt={(section.content as { alt?: string })?.alt || ""}
                          className="rounded-lg w-full"
                        />
                        {(section.content as { caption?: string })?.caption && (
                          <figcaption className="text-center text-muted text-sm mt-2">
                            {(section.content as { caption?: string })?.caption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                    {section.section_type === "video" && (
                      <div className="aspect-video">
                        <iframe
                          src={
                            (section.content as { embed_url?: string })
                              ?.embed_url
                          }
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )
              )
          ) : (
            <div className="text-center py-16 text-muted">
              <p>This page has no content yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
