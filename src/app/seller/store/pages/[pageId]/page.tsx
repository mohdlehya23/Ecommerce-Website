import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageEditor } from "./PageEditor";

export const metadata: Metadata = {
  title: "Edit Page | Seller Dashboard",
  description: "Edit your store page.",
};

interface EditPageProps {
  params: Promise<{ pageId: string }>;
}

export default async function EditStorePage({ params }: EditPageProps) {
  const { pageId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/seller/store/pages/${pageId}`);
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

  // Get page
  const { data: page, error } = await supabase
    .from("store_pages")
    .select(
      `
      *,
      sections:page_sections(*)
    `
    )
    .eq("id", pageId)
    .eq("seller_id", seller.id)
    .single();

  if (error || !page) {
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
            <Link href="/seller/store" className="hover:text-accent">
              Store
            </Link>
            <span className="mx-2">/</span>
            <Link href="/seller/store/pages" className="hover:text-accent">
              Pages
            </Link>
            <span className="mx-2">/</span>
            <span>Edit</span>
          </nav>
          <h1 className="text-3xl font-bold">Edit Page</h1>
        </div>

        {/* Page Editor */}
        <div className="card">
          <PageEditor page={page} sellerId={seller.id} />
        </div>
      </div>
    </div>
  );
}
