import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyInfoForm } from "./CompanyInfoForm";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Company Information | Digital Store",
  description: "Manage your company details for invoices.",
};

export default async function CompanyInfoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/company-info");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;

  // Redirect individual users to dashboard
  if (typedProfile?.user_type !== "business") {
    redirect("/dashboard");
  }

  return (
    <div className="section-padding">
      <div className="container-wide max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted mb-2">
            <Link href="/dashboard" className="hover:text-accent">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <span>Company Info</span>
          </nav>
          <h1 className="text-3xl font-bold">Company Information</h1>
        </div>

        {/* Info Alert */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Invoice Details
              </p>
              <p className="text-xs text-blue-700 mt-1">
                This information will appear on all invoices generated for your
                orders. Ensure your VAT/Tax ID is correct for tax-compliant
                invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="card">
          <CompanyInfoForm profile={typedProfile} />
        </div>
      </div>
    </div>
  );
}
