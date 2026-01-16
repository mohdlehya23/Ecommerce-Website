import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PAYPAL_API =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

interface OrderItem {
  productId: string;
  quantity: number;
  licenseType: "personal" | "commercial";
  price: number;
}

export async function POST(request: Request) {
  try {
    const { orderID, items } = await request.json();

    if (!orderID || !items) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify payment with PayPal
    const accessToken = await getAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureResponse.json();

    if (captureData.status !== "COMPLETED") {
      console.error("Payment not completed:", captureData);
      return NextResponse.json(
        { error: "Payment not completed", success: false },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated", success: false },
        { status: 401 }
      );
    }

    // Calculate total
    const totalAmount = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        payment_status: "completed",
        paypal_order_id: orderID,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order", success: false },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item: OrderItem) => ({
      order_id: order.id,
      product_id: item.productId,
      license_type: item.licenseType,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
    }

    // Extract PayPal Capture ID
    // Structure: captureData.purchase_units[0].payments.captures[0].id
    const captureId =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
      captureData?.id; // Fallback

    // Call fulfillment RPC immediately to update seller balance (idempotent)
    // This ensures earnings are recorded even if webhook fails/delays
    if (captureId) {
      console.log("PAYPAL_DEBUG: Calling fulfillment RPC for Order:", order.id);
      const { error: fulfillmentError } = await supabase.rpc(
        "fulfill_order_from_webhook",
        {
          p_order_id: order.id,
          p_paypal_capture_id: captureId,
          p_escrow_days: 14,
        }
      );

      if (fulfillmentError) {
        console.error("Fulfillment RPC error:", fulfillmentError);
        // We don't fail the request because the payment was successful,
        // and the webhook might retry or admin can fix.
      } else {
        console.log("PAYPAL_DEBUG: Fulfillment RPC successful");
      }
    }

    // Revalidate cache
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/library");

    // Send emails (Receipt & Seller Notification)
    // We import this dynamically or ensure it doesn't block the response
    try {
      // Import here to avoid circular dependencies if any, or just use standard import
      const { sendNewSaleEmail } = await import("@/lib/email");

      // Get full order details with products/sellers for emails
      const { data: fullOrder } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            *,
            products (
              title,
              seller_id,
              profiles:seller_id (email, full_name)
            )
          )
        `
        )
        .eq("id", order.id)
        .single();

      if (fullOrder && fullOrder.order_items) {
        // Send to sellers
        for (const item of fullOrder.order_items) {
          if (item.products?.profiles?.email) {
            // Calculate net amount (90%)
            const saleAmount = item.price;
            const platformFee = Math.round(saleAmount * 0.1 * 100) / 100;
            const sellerEarnings = saleAmount - platformFee;

            await sendNewSaleEmail({
              sellerId: item.products.seller_id,
              sellerEmail: item.products.profiles.email,
              sellerName: item.products.profiles.full_name || "Seller",
              productTitle: item.products.title,
              saleAmount: saleAmount,
              sellerEarnings: sellerEarnings,
              buyerName: user.user_metadata?.full_name || user.email || "Buyer",
            });
          }
        }
      }
    } catch (emailError) {
      console.error("Failed to send post-purchase emails:", emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      captureId: captureId, // Return capture ID for debug
      message: "Payment successful",
    });
  } catch (error) {
    console.error("Capture order error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
