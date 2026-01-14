import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PayoutsTable } from "./PayoutsTable";

export const metadata: Metadata = {
  title: "Payouts Management | Admin",
  description: "Manage seller payout requests",
};

export default async function AdminPayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/payouts");
  }

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!adminUser) {
    redirect("/dashboard");
  }

  // Get all payout requests with seller info
  const { data: payouts, error } = await supabase
    .from("payout_requests")
    .select(
      `
      *,
      seller:sellers (
        id,
        username,
        display_name,
        payout_paypal_email,
        payout_email
      )
    `
    )
    .order("created_at", { ascending: false });

  // Get counts and amounts by status
  const { count: totalCount } = await supabase
    .from("payout_requests")
    .select("*", { count: "exact", head: true });

  const { data: pendingPayouts } = await supabase
    .from("payout_requests")
    .select("amount")
    .eq("status", "pending");

  const pendingAmount =
    pendingPayouts?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const pendingCount = pendingPayouts?.length || 0;

  const { data: completedPayouts } = await supabase
    .from("payout_requests")
    .select("amount")
    .eq("status", "completed");

  const completedAmount =
    completedPayouts?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const { count: processingCount } = await supabase
    .from("payout_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "processing");

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payouts Management</h1>
          <p className="text-muted">
            Process and manage seller payout requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-muted mb-1">Total Requests</p>
            <p className="text-2xl font-bold">{totalCount || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-muted mb-1">Pending ({pendingCount})</p>
            <p className="text-2xl font-bold text-yellow-600">
              ${pendingAmount.toFixed(2)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-muted mb-1">Processing</p>
            <p className="text-2xl font-bold text-blue-600">
              {processingCount || 0}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-muted mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">
              ${completedAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="card p-6">
          {error ? (
            <p className="text-center text-red-600 py-8">
              Error loading payouts
            </p>
          ) : !payouts || payouts.length === 0 ? (
            <p className="text-center text-muted py-8">
              No payout requests found
            </p>
          ) : (
            <PayoutsTable initialPayouts={payouts} />
          )}
        </div>
      </div>
    </div>
  );
}
