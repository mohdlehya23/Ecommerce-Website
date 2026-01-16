import { NextResponse } from "next/server";

// PayPal API URLs
const PAYPAL_API =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Debug: Log credential presence (not values)
  console.log("PAYPAL_DEBUG: Checking credentials...");
  console.log("PAYPAL_DEBUG: Client ID exists:", !!clientId);
  console.log("PAYPAL_DEBUG: Client Secret exists:", !!clientSecret);
  console.log("PAYPAL_DEBUG: API URL:", PAYPAL_API);

  if (!clientId || !clientSecret) {
    console.error(
      "DETAILED_PAYPAL_ERROR: Missing environment variables. " +
        "Ensure NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set in .env.local"
    );
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  console.log("PAYPAL_DEBUG: Requesting access token...");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const responseText = await response.text();
  console.log("PAYPAL_DEBUG: Token response status:", response.status);

  if (!response.ok) {
    console.error("DETAILED_PAYPAL_ERROR: Failed to get access token");
    console.error("DETAILED_PAYPAL_ERROR: Status:", response.status);
    console.error("DETAILED_PAYPAL_ERROR: Response:", responseText);
    throw new Error(`PayPal auth failed: ${response.status}`);
  }

  const data = JSON.parse(responseText);
  console.log("PAYPAL_DEBUG: Access token obtained successfully");
  return data.access_token;
}

interface CartItem {
  productId: string;
  quantity: number;
  licenseType: string;
  price: number;
}

export async function POST(request: Request) {
  console.log("PAYPAL_DEBUG: === CREATE ORDER REQUEST STARTED ===");

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("PAYPAL_DEBUG: Request body parsed successfully");
      console.log("PAYPAL_DEBUG: Items count:", body.items?.length);
      console.log("PAYPAL_DEBUG: Total from frontend:", body.total);
    } catch (parseError) {
      console.error(
        "DETAILED_PAYPAL_ERROR: Failed to parse request JSON:",
        parseError
      );
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { items, total } = body as { items: CartItem[]; total: number };

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error(
        "DETAILED_PAYPAL_ERROR: No items in cart or invalid items array"
      );
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Validate total
    if (typeof total !== "number" || total <= 0) {
      console.error("DETAILED_PAYPAL_ERROR: Invalid total:", total);
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    // Log each item for debugging
    items.forEach((item, index) => {
      console.log(`PAYPAL_DEBUG: Item ${index + 1}:`, {
        productId: item.productId,
        quantity: item.quantity,
        licenseType: item.licenseType,
        price: item.price,
      });
    });

    // Get PayPal access token
    const accessToken = await getAccessToken();

    // Build PayPal order - all amounts in USD
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: total.toFixed(2),
              },
            },
          },
          items: items.map((item) => ({
            name: `Product ${item.productId.slice(0, 8)}`,
            quantity: String(item.quantity),
            unit_amount: {
              currency_code: "USD",
              value: item.price.toFixed(2),
            },
            description: `License: ${item.licenseType}`,
          })),
        },
      ],
    };

    console.log("PAYPAL_DEBUG: Order data prepared");
    console.log("PAYPAL_DEBUG: Order total:", total.toFixed(2), "USD");

    // Create order with PayPal
    console.log("PAYPAL_DEBUG: Sending create order request to PayPal...");
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const orderResponseText = await response.text();
    console.log("PAYPAL_DEBUG: Create order response status:", response.status);

    if (!response.ok) {
      console.error("DETAILED_PAYPAL_ERROR: Order creation failed");
      console.error("DETAILED_PAYPAL_ERROR: Status:", response.status);
      console.error("DETAILED_PAYPAL_ERROR: Response:", orderResponseText);
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 }
      );
    }

    const order = JSON.parse(orderResponseText);

    if (order.id) {
      console.log("PAYPAL_DEBUG: Order created successfully!");
      console.log("PAYPAL_DEBUG: Order ID:", order.id);
      console.log("PAYPAL_DEBUG: === CREATE ORDER REQUEST COMPLETED ===");

      // Return orderId (this is what the frontend expects)
      return NextResponse.json({ orderId: order.id }, { status: 200 });
    } else {
      console.error("DETAILED_PAYPAL_ERROR: No order ID in response");
      console.error("DETAILED_PAYPAL_ERROR: Full response:", orderResponseText);
      return NextResponse.json(
        { error: "No order ID returned from PayPal" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("DETAILED_PAYPAL_ERROR: Unhandled exception:", error);
    console.error(
      "DETAILED_PAYPAL_ERROR: Stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
