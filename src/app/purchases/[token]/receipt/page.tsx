import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicReceiptClient } from "./PublicReceiptClient";
import type { Order, OrderItem, Product } from "@/types";

export const metadata: Metadata = {
  title: "Your Purchase | Digital Store",
  description: "View your purchase receipt and access your downloads.",
};

interface PublicReceiptPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicReceiptPage({
  params,
}: PublicReceiptPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Lookup order by receipt token
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_email,
      buyer_name,
      total_amount,
      payment_status,
      receipt_token,
      receipt_token_expires_at,
      created_at,
      order_items (
        *,
        product:products (id, title, slug, category, product_type, image_url)
      )
    `
    )
    .eq("receipt_token", token)
    .single();

  if (error || !order) {
    notFound();
  }

  // Check if token expired
  const isExpired =
    order.receipt_token_expires_at &&
    new Date(order.receipt_token_expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center section-padding">
        <div className="card text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Receipt Link Expired</h1>
          <p className="text-muted mb-6">
            This receipt link has expired. Please log in to your account to
            access your purchases, or contact support if you need assistance.
          </p>
          <a href="/login" className="btn-primary">
            Log In
          </a>
        </div>
      </div>
    );
  }

  const typedOrder = order as unknown as Order & {
    order_items: (OrderItem & { product: Product })[];
  };

  return <PublicReceiptClient order={typedOrder} token={token} />;
}
