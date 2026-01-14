"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface CompanyInfoFormProps {
  profile: Profile;
}

export function CompanyInfoForm({ profile }: CompanyInfoFormProps) {
  const [formData, setFormData] = useState({
    company_name: profile.company_name || "",
    vat_id: profile.vat_id || "",
    company_email: profile.company_email || "",
    company_address: profile.company_address || "",
    company_city: profile.company_city || "",
    company_country: profile.company_country || "",
    invoice_notes: profile.invoice_notes || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: formData.company_name || null,
          vat_id: formData.vat_id || null,
          company_email: formData.company_email || null,
          company_address: formData.company_address || null,
          company_city: formData.company_city || null,
          company_country: formData.company_country || null,
          invoice_notes: formData.invoice_notes || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Company information saved successfully!",
      });
    } catch (error) {
      console.error("Error saving company info:", error);
      setMessage({ type: "error", text: "Failed to save. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success/Error Message */}
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

      {/* Company Name */}
      <div>
        <label htmlFor="company_name" className="label">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          required
          className="input"
          placeholder="Your Company Ltd."
        />
      </div>

      {/* VAT/Tax ID */}
      <div>
        <label htmlFor="vat_id" className="label">
          VAT/Tax ID
        </label>
        <input
          type="text"
          id="vat_id"
          name="vat_id"
          value={formData.vat_id}
          onChange={handleChange}
          className="input"
          placeholder="e.g., GB123456789"
        />
        <p className="text-xs text-muted mt-1">
          Include your country prefix for VAT numbers
        </p>
      </div>

      {/* Company Email */}
      <div>
        <label htmlFor="company_email" className="label">
          Company Email
        </label>
        <input
          type="email"
          id="company_email"
          name="company_email"
          value={formData.company_email}
          onChange={handleChange}
          className="input"
          placeholder="billing@yourcompany.com"
        />
      </div>

      {/* Company Address */}
      <div>
        <label htmlFor="company_address" className="label">
          Address
        </label>
        <input
          type="text"
          id="company_address"
          name="company_address"
          value={formData.company_address}
          onChange={handleChange}
          className="input"
          placeholder="123 Business Street"
        />
      </div>

      {/* City & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company_city" className="label">
            City
          </label>
          <input
            type="text"
            id="company_city"
            name="company_city"
            value={formData.company_city}
            onChange={handleChange}
            className="input"
            placeholder="London"
          />
        </div>
        <div>
          <label htmlFor="company_country" className="label">
            Country
          </label>
          <input
            type="text"
            id="company_country"
            name="company_country"
            value={formData.company_country}
            onChange={handleChange}
            className="input"
            placeholder="United Kingdom"
          />
        </div>
      </div>

      {/* Invoice Notes */}
      <div>
        <label htmlFor="invoice_notes" className="label">
          Additional Invoice Notes
        </label>
        <textarea
          id="invoice_notes"
          name="invoice_notes"
          value={formData.invoice_notes}
          onChange={handleChange}
          rows={3}
          className="input resize-none"
          placeholder="Any additional notes to include on your invoices (optional)"
        />
      </div>

      {/* Submit Button */}
      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? "Saving..." : "Save Company Information"}
      </button>
    </form>
  );
}
