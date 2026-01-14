"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PageEditorProps {
  page: {
    id: string;
    title: string;
    slug: string;
    is_published: boolean;
    meta_description: string | null;
  };
  sellerId: string;
}

export function PageEditor({ page, sellerId }: PageEditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: page.title || "",
    slug: page.slug || "",
    is_published: page.is_published || false,
    meta_description: page.meta_description || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("store_pages")
        .update({
          title: formData.title,
          slug: formData.slug,
          is_published: formData.is_published,
          meta_description: formData.meta_description || null,
        })
        .eq("id", page.id)
        .eq("seller_id", sellerId);

      if (error) throw error;

      setMessage({ type: "success", text: "Page saved successfully!" });
      router.refresh();
    } catch (error) {
      console.error("Error saving page:", error);
      setMessage({ type: "error", text: "Failed to save. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="label">
          Page Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="input"
          placeholder="About Me"
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="label">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          required
          className="input"
          placeholder="about-me"
        />
      </div>

      {/* Meta Description */}
      <div>
        <label htmlFor="meta_description" className="label">
          Meta Description
        </label>
        <textarea
          id="meta_description"
          name="meta_description"
          value={formData.meta_description}
          onChange={handleChange}
          rows={2}
          className="input resize-none"
          placeholder="A brief description for search engines..."
        />
      </div>

      {/* Published */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_published"
          name="is_published"
          checked={formData.is_published}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
        />
        <label htmlFor="is_published" className="text-sm font-medium">
          Published (visible to customers)
        </label>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Page sections and content editing coming soon.
          For now, you can manage basic page settings here.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? "Saving..." : "Save Page"}
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
