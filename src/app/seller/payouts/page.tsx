import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestPayoutButton } from "./RequestPayoutButton";

export const metadata: Metadata = {
  title: "Payouts | Seller Dashboard",
  description: "View your earnings and payout history.",
};

export default async function SellerPayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/payouts");
  }

  // Get seller profile with balance columns
  const { data: seller } = await supabase
    .from("sellers")
    .select(
      `
      id, 
      seller_status, 
      payout_email,
      payout_paypal_email,
      pending_balance,
      available_balance,
      total_earnings
    `
    )
    .eq("id", user.id)
    .single();

  // Allow sellers with active or payouts_locked status
  if (!seller || seller.seller_status === "suspended") {
    redirect("/seller");
  }

  // Get payout requests
  const { data: payoutRequests } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  const payoutList = payoutRequests || [];

  // Get earnings breakdown
  const { data: earnings } = await supabase
    .from("seller_earnings")
    .select("*")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const earningsList = earnings || [];

  // Calculate escrow earnings (not yet released)
  const escrowEarnings = earningsList.filter((e) => e.status === "escrow");
  const escrowAmount = escrowEarnings.reduce(
    (sum, e) => sum + (e.net_amount || 0),
    0
  );

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    escrow: "bg-purple-100 text-purple-700",
    available: "bg-green-100 text-green-700",
  };

  const availableBalance = seller.available_balance || 0;
  const pendingBalance = seller.pending_balance || 0;
  const totalEarnings = seller.total_earnings || 0;
  const canRequestPayout = availableBalance >= 10;
  const payoutEmail = seller.payout_paypal_email || seller.payout_email;

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <nav className="text-sm text-muted mb-2">
              <Link href="/seller" className="hover:text-accent">
                Dashboard
              </Link>
              <span className="mx-2">/</span>
              <span>Payouts</span>
            </nav>
            <h1 className="text-3xl font-bold">Payouts</h1>
          </div>
          <Link href="/seller/payout-settings" className="btn-outline">
            Payout Settings
          </Link>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Available for Withdrawal</p>
            <p className="text-3xl font-bold text-green-600">
              ${availableBalance.toFixed(2)}
            </p>
            {canRequestPayout && (
              <RequestPayoutButton
                maxAmount={availableBalance}
                hasPayoutEmail={!!payoutEmail}
              />
            )}
            {!canRequestPayout && availableBalance > 0 && (
              <p className="text-xs text-muted mt-2">
                Minimum $10 required for withdrawal
              </p>
            )}
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">In Escrow (14 days)</p>
            <p className="text-3xl font-bold text-purple-600">
              ${pendingBalance.toFixed(2)}
            </p>
            <p className="text-xs text-muted mt-1">
              Funds are held for 14 days after each sale
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-primary">
              ${totalEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-muted mt-1">
              Lifetime earnings (90% of sales)
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted mb-1">Payout Email</p>
            {payoutEmail ? (
              <p className="text-sm font-medium truncate">{payoutEmail}</p>
            ) : (
              <Link
                href="/seller/payout-settings"
                className="text-sm text-accent hover:underline"
              >
                Configure PayPal email →
              </Link>
            )}
          </div>
        </div>

        {/* Payout Requests */}
        <div className="card mb-8">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Payout Requests</h2>
          </div>
          {payoutList.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p>No payout requests yet</p>
              <p className="text-sm mt-1">
                Request a payout when you have $10+ available
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payoutList.map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold">
                        ${payout.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            statusColors[payout.status] || "bg-gray-100"
                          }`}
                        >
                          {payout.status}
                        </span>
                        {payout.failure_reason && (
                          <p className="text-xs text-red-500 mt-1">
                            {payout.failure_reason}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">
                        {payout.payout_email}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Earnings */}
        <div className="card">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Recent Earnings</h2>
          </div>
          {earningsList.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p>No earnings yet</p>
              <p className="text-sm mt-1">
                Earnings appear here after customers purchase your products
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Your Earnings
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Sale Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Platform Fee
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Release Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {earningsList.map((earning) => (
                    <tr key={earning.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-green-600">
                        ${earning.net_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        ${earning.gross_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">
                        -${earning.platform_fee.toFixed(2)} (10%)
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            statusColors[earning.status] || "bg-gray-100"
                          }`}
                        >
                          {earning.status === "escrow"
                            ? "In Escrow"
                            : earning.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">
                        {earning.status === "escrow" ? (
                          <>
                            {new Date(
                              earning.release_date
                            ).toLocaleDateString()}
                          </>
                        ) : (
                          <span className="text-green-600">Released</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
