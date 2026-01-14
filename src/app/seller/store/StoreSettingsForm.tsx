"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Seller {
  id: string;
  username: string;
  store_name: string;
  store_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
}

interface StoreSettingsFormProps {
  seller: Seller;
}

export function StoreSettingsForm({ seller }: StoreSettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    store_name: seller.store_name || "",
    store_description: seller.store_description || "",
    logo_url: seller.logo_url || "",
    banner_url: seller.banner_url || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sellers")
        .update({
          store_name: formData.store_name,
          store_description: formData.store_description || null,
          logo_url: formData.logo_url || null,
          banner_url: formData.banner_url || null,
        })
        .eq("id", seller.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Store settings saved successfully!",
      });
      router.refresh();
    } catch (error) {
      console.error("Error saving store settings:", error);
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

      {/* Store Name */}
      <div>
        <label htmlFor="store_name" className="label">
          Store Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="store_name"
          name="store_name"
          value={formData.store_name}
          onChange={handleChange}
          required
          className="input"
          placeholder="My Awesome Store"
        />
      </div>

      {/* Store Description */}
      <div>
        <label htmlFor="store_description" className="label">
          Store Description
        </label>
        <textarea
          id="store_description"
          name="store_description"
          value={formData.store_description}
          onChange={handleChange}
          rows={3}
          className="input resize-none"
          placeholder="Tell customers about your store..."
        />
      </div>

      {/* Logo URL */}
      <div>
        <label htmlFor="logo_url" className="label">
          Logo URL
        </label>
        <input
          type="url"
          id="logo_url"
          name="logo_url"
          value={formData.logo_url}
          onChange={handleChange}
          className="input"
          placeholder="https://example.com/logo.png"
        />
        <p className="text-xs text-muted mt-1">
          Recommended: Square image, at least 200x200px
        </p>
      </div>

      {/* Banner URL */}
      <div>
        <label htmlFor="banner_url" className="label">
          Banner URL
        </label>
        <input
          type="url"
          id="banner_url"
          name="banner_url"
          value={formData.banner_url}
          onChange={handleChange}
          className="input"
          placeholder="https://example.com/banner.jpg"
        />
        <p className="text-xs text-muted mt-1">
          Recommended: 1200x400px or wider
        </p>
      </div>

      {/* Submit */}
      <button type="submit" disabled={isLoading} className="btn-primary">
        {isLoading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
