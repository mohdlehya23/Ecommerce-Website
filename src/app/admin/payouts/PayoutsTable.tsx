"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface PayoutRequest {
  id: string;
  seller_id: string;
  amount: number;
  payout_email: string;
  status: string;
  paypal_batch_id?: string;
  paypal_transaction_id?: string;
  failure_reason?: string;
  created_at: string;
  processed_at?: string;
  seller?: {
    id: string;
    username: string;
    display_name: string | null;
    payout_paypal_email?: string;
    payout_email?: string;
  };
}

export function PayoutsTable({
  initialPayouts,
}: {
  initialPayouts: PayoutRequest[];
}) {
  const router = useRouter();
  const [payouts, setPayouts] = useState(initialPayouts);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processPayPalPayout = async (payoutId: string) => {
    if (
      !confirm(
        "Are you sure you want to process this payout via PayPal? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(payoutId);
    setError(null);

    try {
      const response = await fetch("/api/payouts/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: payoutId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payout");
      }

      // Update local state
      setPayouts(
        payouts.map((p) =>
          p.id === payoutId
            ? { ...p, status: "completed", paypal_batch_id: data.batchId }
            : p
        )
      );

      alert("Payout processed successfully!");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process";
      setError(message);
      console.error("Payout error:", err);
    } finally {
      setLoading(null);
    }
  };

  const markAsFailed = async (payoutId: string) => {
    const reason = prompt("Enter failure reason:");
    if (!reason) return;

    setLoading(payoutId);
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error("Failed to mark as failed");

      setPayouts(
        payouts.map((p) =>
          p.id === payoutId
            ? { ...p, status: "failed", failure_reason: reason }
            : p
        )
      );
      router.refresh();
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                Seller
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                Amount
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                PayPal Email
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                Requested
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr
                key={payout.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-2">
                  <div>
                    <span className="text-sm font-medium">
                      {payout.seller?.display_name ||
                        payout.seller?.username ||
                        "Unknown"}
                    </span>
                    {payout.seller?.username && (
                      <p className="text-xs text-muted">
                        @{payout.seller.username}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm font-bold text-green-600">
                    ${payout.amount.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-xs text-muted">
                    {payout.payout_email}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <StatusBadge status={payout.status} type="payout" />
                  {payout.failure_reason && (
                    <p className="text-xs text-red-500 mt-1">
                      {payout.failure_reason}
                    </p>
                  )}
                  {payout.paypal_batch_id && (
                    <p className="text-xs text-muted mt-1">
                      Batch: {payout.paypal_batch_id.substring(0, 12)}...
                    </p>
                  )}
                </td>
                <td className="py-3 px-2">
                  <span className="text-xs text-muted">
                    {new Date(payout.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-2">
                    {payout.status === "pending" && (
                      <>
                        <button
                          onClick={() => processPayPalPayout(payout.id)}
                          disabled={loading === payout.id}
                          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                        >
                          {loading === payout.id
                            ? "Processing..."
                            : "Approve & Pay"}
                        </button>
                        <button
                          onClick={() => markAsFailed(payout.id)}
                          disabled={loading === payout.id}
                          className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {payout.status === "processing" && (
                      <span className="text-xs text-blue-600">
                        Awaiting PayPal confirmation...
                      </span>
                    )}
                    {payout.status === "completed" && (
                      <span className="text-xs text-green-600">✓ Paid</span>
                    )}
                    {payout.status === "failed" && (
                      <button
                        onClick={() => processPayPalPayout(payout.id)}
                        disabled={loading === payout.id}
                        className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
