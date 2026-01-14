"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RequestPayoutButtonProps {
  maxAmount: number;
  hasPayoutEmail: boolean;
}

export function RequestPayoutButton({
  maxAmount,
  hasPayoutEmail,
}: RequestPayoutButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(maxAmount.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request payout");
      }

      setIsOpen(false);
      router.refresh();
      alert(
        "Payout requested successfully! It will be processed within 1-3 business days."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!hasPayoutEmail) {
    return (
      <a
        href="/seller/payout-settings"
        className="inline-block mt-3 text-sm text-accent hover:underline"
      >
        Configure PayPal email first →
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full btn-primary text-sm py-2"
      >
        Request Payout
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Request Payout</h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="label">Amount to withdraw</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={maxAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input pl-8"
                    required
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  Available: ${maxAmount.toFixed(2)} • Minimum: $10.00
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || parseFloat(amount) < 10}
                  className="flex-1 btn-primary"
                >
                  {loading ? "Requesting..." : "Request Payout"}
                </button>
              </div>
            </form>

            <p className="text-xs text-muted text-center mt-4">
              Payouts are processed via PayPal within 1-3 business days
            </p>
          </div>
        </div>
      )}
    </>
  );
}
