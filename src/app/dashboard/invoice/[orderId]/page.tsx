import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/dashboard/PrintButton";
import type { Order, OrderItem, Product, Profile } from "@/types";

export const metadata: Metadata = {
  title: "Invoice | Digital Store",
  description: "View and print your invoice.",
};

interface InvoicePageProps {
  params: Promise<{ orderId: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/dashboard/invoice/${orderId}`);
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        product:products (*)
      )
    `
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedOrder = order as Order & {
    order_items: (OrderItem & { product: Product })[];
  };
  const typedProfile = profile as Profile | null;

  // Only allow completed orders
  if (typedOrder.payment_status !== "completed") {
    redirect(`/dashboard/purchases/${orderId}`);
  }

  const invoiceNumber = `INV-${typedOrder.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date(typedOrder.created_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Get buyer info
  const isBusiness = typedProfile?.user_type === "business";
  const buyerName = isBusiness
    ? typedProfile?.company_name
    : typedProfile?.full_name || typedOrder.buyer_name;
  const buyerEmail = isBusiness
    ? typedProfile?.company_email || typedProfile?.email
    : typedProfile?.email || typedOrder.buyer_email;
  const buyerAddress = isBusiness
    ? [
        typedProfile?.company_address,
        typedProfile?.company_city,
        typedProfile?.company_country,
      ]
        .filter(Boolean)
        .join(", ")
    : [typedProfile?.address, typedProfile?.city, typedProfile?.country]
        .filter(Boolean)
        .join(", ");

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-full { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      {/* Print Button (Client Component) */}
      <PrintButton />

      {/* Invoice Content */}
      <div className="min-h-screen bg-white py-8 print-full">
        <div className="max-w-3xl mx-auto px-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <span className="font-bold text-2xl">Digital Store</span>
              </div>
              <p className="text-muted text-sm">Premium Digital Products</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h1>
              <p className="text-sm text-muted">
                <span className="font-medium">Invoice #:</span> {invoiceNumber}
              </p>
              <p className="text-sm text-muted">
                <span className="font-medium">Date:</span> {invoiceDate}
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                PAID
              </span>
            </div>
          </div>

          {/* Seller & Buyer Info */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-semibold text-muted mb-2">FROM</h3>
              <p className="font-medium">Digital Store</p>
              <p className="text-sm text-muted">contact@digitalstore.com</p>
              <p className="text-sm text-muted">www.digitalstore.com</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted mb-2">BILL TO</h3>
              <p className="font-medium">{buyerName || "Customer"}</p>
              {isBusiness && typedProfile?.vat_id && (
                <p className="text-sm text-muted">VAT: {typedProfile.vat_id}</p>
              )}
              <p className="text-sm text-muted">{buyerEmail}</p>
              {buyerAddress && (
                <p className="text-sm text-muted">{buyerAddress}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 font-semibold">Description</th>
                <th className="text-left py-3 font-semibold">License</th>
                <th className="text-right py-3 font-semibold">Qty</th>
                <th className="text-right py-3 font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              {typedOrder.order_items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-medium">
                      {item.product?.title || "Product"}
                    </p>
                    <p className="text-xs text-muted">
                      {item.product?.category}
                    </p>
                  </td>
                  <td className="py-4 text-sm">
                    {item.license_type === "commercial"
                      ? "Commercial"
                      : "Personal"}
                  </td>
                  <td className="py-4 text-right">1</td>
                  <td className="py-4 text-right font-medium">
                    ${item.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium">
                  ${typedOrder.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted">Tax</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-200">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl">
                  ${typedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {typedProfile?.invoice_notes && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-muted mb-2">Notes</h3>
              <p className="text-sm">{typedProfile.invoice_notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-muted mb-2">
              Payment confirmed via PayPal
              {typedOrder.paypal_order_id && (
                <span className="font-mono">
                  {" "}
                  • Ref: {typedOrder.paypal_order_id.slice(0, 12)}...
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              Thank you for your purchase! For support, contact
              support@digitalstore.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
