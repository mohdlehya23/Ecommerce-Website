import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller profile
    const { data: seller } = await supabase
      .from("sellers")
      .select("id, seller_status")
      .eq("id", user.id)
      .single();

    if (!seller || seller.seller_status === "suspended") {
      return NextResponse.json(
        { error: "Seller account not found or suspended" },
        { status: 403 }
      );
    }

    // Verify product belongs to this seller
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, seller_id, title, file_path")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.seller_id !== seller.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this product" },
        { status: 403 }
      );
    }

    // Check if product has any completed orders
    const { count: orderCount } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId);

    if (orderCount && orderCount > 0) {
      // Don't delete, just set status to inactive/archived
      const { error: updateError } = await supabase
        .from("products")
        .update({ status: "archived" })
        .eq("id", productId);

      if (updateError) {
        console.error("Archive product error:", updateError);
        return NextResponse.json(
          { error: "Failed to archive product" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        archived: true,
        message: "Product has been archived because it has existing orders",
      });
    }

    // No orders, safe to delete
    // Optionally delete file from storage
    if (product.file_path) {
      await supabase.storage.from("downloads").remove([product.file_path]);
    }

    // Delete the product
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      console.error("Delete product error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      archived: false,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
