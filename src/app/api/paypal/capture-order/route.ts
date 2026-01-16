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

    // Revalidate cache for dashboard pages so new order shows immediately
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/library");

    return NextResponse.json({
      success: true,
      orderId: order.id,
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
