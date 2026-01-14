import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const token = searchParams.get("token"); // Public receipt token

    if (!orderId || !productId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check 1: User Authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check 2: Receipt Session Cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("receipt_session")?.value;

    let isAuthorized = false;

    // Build the order query
    let orderQuery = supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("payment_status", "completed");

    if (user) {
      // If authenticad, check user_id
      orderQuery = orderQuery.eq("user_id", user.id);
    } else if (token || sessionToken) {
      // If using token (from URL or Session), check receipt_token
      // Prefer URL token if provided, otherwise session token
      const checkToken = token || sessionToken;
      orderQuery = orderQuery.eq("receipt_token", checkToken);
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: order, error: orderError } = await orderQuery.single();

    if (!order || orderError) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    // Verify product is part of order
    const { data: orderItem } = await supabase
      .from("order_items")
      .select("*, product:products(*)")
      .eq("order_id", orderId)
      .eq("product_id", productId)
      .single();

    if (!orderItem) {
      return NextResponse.json(
        { error: "Product not found in order" },
        { status: 404 }
      );
    }

    const product = orderItem.product;

    if (!product?.file_path) {
      return NextResponse.json(
        { error: "No downloadable file available" },
        { status: 404 }
      );
    }

    // Generate signed URL for download (valid for 1 hour)
    // Permission check was done via the order query above
    const { data: signedUrl, error: signError } = await supabase.storage
      .from("downloads")
      .createSignedUrl(product.file_path, 3600); // 1 hour expiry

    if (signError || !signedUrl) {
      console.error("Signed URL error:", signError);
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl.signedUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
