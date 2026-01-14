"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface Seller {
  id: string;
  username: string;
  display_name: string | null;
  seller_status: string;
  created_at: string;
  _count?: { products: number };
}

export function SellersTable({ initialSellers }: { initialSellers: Seller[] }) {
  const [sellers, setSellers] = useState(initialSellers);
  const [loading, setLoading] = useState<string | null>(null);

  const updateSellerStatus = async (sellerId: string, newStatus: string) => {
    setLoading(sellerId);
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update seller status");

      // Update local state
      setSellers(
        sellers.map((s) =>
          s.id === sellerId ? { ...s, seller_status: newStatus } : s
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update seller status");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
              Seller
            </th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
              Status
            </th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
              Products
            </th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
              Joined
            </th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sellers.map((seller) => (
            <tr
              key={seller.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 px-2">
                <div>
                  <Link
                    href={`/creators/${seller.username}`}
                    className="font-medium text-sm text-accent hover:underline"
                  >
                    {seller.display_name || seller.username}
                  </Link>
                  <p className="text-xs text-muted">@{seller.username}</p>
                </div>
              </td>
              <td className="py-3 px-2">
                <StatusBadge status={seller.seller_status} type="seller" />
              </td>
              <td className="py-3 px-2">
                <span className="text-sm">{seller._count?.products || 0}</span>
              </td>
              <td className="py-3 px-2">
                <span className="text-xs text-muted">
                  {new Date(seller.created_at).toLocaleDateString()}
                </span>
              </td>
              <td className="py-3 px-2">
                <div className="flex gap-2">
                  {seller.seller_status === "pending" && (
                    <button
                      onClick={() => updateSellerStatus(seller.id, "active")}
                      disabled={loading === seller.id}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading === seller.id ? "..." : "Approve"}
                    </button>
                  )}
                  {seller.seller_status === "active" && (
                    <button
                      onClick={() => updateSellerStatus(seller.id, "suspended")}
                      disabled={loading === seller.id}
                      className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading === seller.id ? "..." : "Suspend"}
                    </button>
                  )}
                  {seller.seller_status === "suspended" && (
                    <button
                      onClick={() => updateSellerStatus(seller.id, "active")}
                      disabled={loading === seller.id}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading === seller.id ? "..." : "Activate"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
