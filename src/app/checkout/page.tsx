import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase securely with PayPal.",
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/checkout");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <CheckoutClient user={user} profile={profile} />;
}
