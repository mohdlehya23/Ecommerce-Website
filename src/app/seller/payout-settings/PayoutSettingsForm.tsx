"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Seller {
  id: string;
  payout_email: string | null;
  payout_paypal_email: string | null;
}

interface PayoutSettingsFormProps {
  seller: Seller;
}

export function PayoutSettingsForm({ seller }: PayoutSettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Use payout_paypal_email if set, fallback to payout_email
    payout_paypal_email:
      seller.payout_paypal_email || seller.payout_email || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
          // Update both fields for compatibility
          payout_email: formData.payout_paypal_email || null,
          payout_paypal_email: formData.payout_paypal_email || null,
        })
        .eq("id", seller.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Payout settings saved successfully!",
      });
      router.refresh();
    } catch (error) {
      console.error("Error saving payout settings:", error);
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

      {/* Payout Method - Display only (always PayPal) */}
      <div>
        <label className="label">Payout Method</label>
        <div className="input bg-gray-50 cursor-not-allowed">PayPal</div>
        <p className="text-xs text-muted mt-1">
          Currently, payouts are processed via PayPal only.
        </p>
      </div>

      {/* PayPal Email */}
      <div>
        <label htmlFor="payout_paypal_email" className="label">
          PayPal Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="payout_paypal_email"
          name="payout_paypal_email"
          value={formData.payout_paypal_email}
          onChange={handleChange}
          required
          className="input"
          placeholder="your-paypal@email.com"
        />
        <p className="text-xs text-muted mt-1">
          This is the email where you&apos;ll receive your payouts
        </p>
      </div>

      {/* Submit */}
      <button type="submit" disabled={isLoading} className="btn-primary">
        {isLoading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
