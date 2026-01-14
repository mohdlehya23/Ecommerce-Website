"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProductFormProps {
  sellerId: string;
  product?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price_b2c: number;
    price_b2b: number | null;
    category: string;
    product_type: string;
    image_url: string | null;
    file_path: string | null;
    status: string;
  };
}

// Categories must match database constraint
const CATEGORIES = ["ebooks", "templates", "consulting"];

export function ProductForm({ sellerId, product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    title: product?.title || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price_b2c?.toString() || "",
    commercial_price: product?.price_b2b?.toString() || "",
    category: product?.category || "templates",
    product_type: product?.product_type || "downloadable",
    image_url: product?.image_url || "",
    status: product?.status || "draft",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: isEditing ? formData.slug : generateSlug(title),
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      let finalSlug = formData.slug;

      // Check for existing slug
      if (!isEditing) {
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("slug", finalSlug);

        if (count && count > 0) {
          // Append random string if slug exists
          finalSlug = `${finalSlug}-${Math.random()
            .toString(36)
            .substring(2, 7)}`;
        }
      }

      const productData = {
        seller_id: sellerId,
        title: formData.title,
        slug: finalSlug,
        description: formData.description,
        price_b2c: parseFloat(formData.price),
        price_b2b: formData.commercial_price
          ? parseFloat(formData.commercial_price)
          : parseFloat(formData.price),
        category: formData.category,
        product_type: formData.product_type,
        image_url: formData.image_url || null,
        status: formData.status,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert(productData);

        if (insertError) throw insertError;
      }

      router.push("/seller/products");
      router.refresh();
    } catch (err: unknown) {
      console.error("Product save error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to save product";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="label">
          Product Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleTitleChange}
          required
          className="input"
          placeholder="e.g., Professional Resume Template"
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="label">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm">/products/</span>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className="input flex-1"
            placeholder="professional-resume-template"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="label">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="input resize-none"
          placeholder="Describe your product..."
        />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="label">
            Price (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              $
            </span>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="input pl-7"
              placeholder="29.99"
            />
          </div>
        </div>
        <div>
          <label htmlFor="commercial_price" className="label">
            Commercial License Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              $
            </span>
            <input
              type="number"
              id="commercial_price"
              name="commercial_price"
              value={formData.commercial_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="input pl-7"
              placeholder="99.99"
            />
          </div>
          <p className="text-xs text-muted mt-1">
            Leave empty if no commercial license option
          </p>
        </div>
      </div>

      {/* Category & Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="label">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="input"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product_type" className="label">
            Product Type <span className="text-red-500">*</span>
          </label>
          <select
            id="product_type"
            name="product_type"
            value={formData.product_type}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="downloadable">Downloadable</option>
            <option value="virtual">Virtual</option>
          </select>
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="image_url" className="label">
          Product Image URL
        </label>
        <input
          type="url"
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          className="input"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-muted mt-1">
          Use a direct image URL (e.g., from an image hosting service)
        </p>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="label">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="input"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading
            ? "Saving..."
            : isEditing
            ? "Update Product"
            : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
