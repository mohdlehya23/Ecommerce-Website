import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch order with items and user profile - verify ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          product:products (title, category)
        )
      `
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found or not accessible" },
        { status: 404 }
      );
    }

    // Fetch user profile for business details
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHtml(order, profile, user.email || "");

    return new NextResponse(invoiceHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Invoice error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface OrderItem {
  id: string;
  price: number;
  license_type: string;
  product: {
    title: string;
    category: string;
  } | null;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  paypal_order_id: string | null;
  order_items: OrderItem[];
}

interface Profile {
  full_name: string | null;
  user_type: string;
}

function generateInvoiceHtml(
  order: Order,
  profile: Profile | null,
  email: string
): string {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsHtml = order.order_items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          ${item.product?.title || "Product"}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          ${item.license_type === "commercial" ? "Commercial" : "Personal"}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          $${item.price.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - Order #${order.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      padding: 40px 20px;
      color: #0f172a;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 40px;
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { opacity: 0.9; }
    .content { padding: 40px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .info-section h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .info-section p { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th {
      text-align: left;
      padding: 12px;
      background: #f8fafc;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    th:last-child { text-align: right; }
    .total-row {
      background: #f8fafc;
      font-weight: 600;
    }
    .total-row td { padding: 16px 12px; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-completed { background: #dcfce7; color: #15803d; }
    .status-pending { background: #fef3c7; color: #a16207; }
    .footer {
      text-align: center;
      padding: 24px;
      background: #f8fafc;
      color: #64748b;
      font-size: 14px;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice { box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>Invoice</h1>
      <p>Order #${order.id.slice(0, 8).toUpperCase()}</p>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="info-section">
          <h3>Bill To</h3>
          <p><strong>${profile?.full_name || "Customer"}</strong></p>
          <p>${email}</p>
          <p>Account Type: ${
            profile?.user_type === "business"
              ? "Business (B2B)"
              : "Individual (B2C)"
          }</p>
        </div>
        <div class="info-section" style="text-align: right;">
          <h3>Invoice Details</h3>
          <p><strong>Date:</strong> ${orderDate}</p>
          <p><strong>Status:</strong> 
            <span class="status-badge ${
              order.payment_status === "completed"
                ? "status-completed"
                : "status-pending"
            }">
              ${
                order.payment_status.charAt(0).toUpperCase() +
                order.payment_status.slice(1)
              }
            </span>
          </p>
          ${
            order.paypal_order_id
              ? `<p><strong>PayPal ID:</strong> ${order.paypal_order_id}</p>`
              : ""
          }
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>License</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td style="text-align: right; font-size: 18px;">$${order.total_amount.toFixed(
              2
            )}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Thank you for your purchase!</p>
      <p class="no-print" style="margin-top: 16px;">
        <button onclick="window.print()" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        ">
          Print / Save as PDF
        </button>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
