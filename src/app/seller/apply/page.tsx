"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SellerApplyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    paypal_email: "",
  });

  // Check if user email is confirmed on page load
  useEffect(() => {
    async function checkEmailConfirmation() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/seller/apply");
        return;
      }
      // Check if email is confirmed
      if (!user.email_confirmed_at) {
        setEmailNotConfirmed(true);
      }
    }
    checkEmailConfirmation();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/seller/apply");
        return;
      }

      // Double-check email confirmation
      if (!user.email_confirmed_at) {
        setError("You must confirm your email before becoming a seller.");
        setLoading(false);
        return;
      }

      // Check if username is available
      const { data: existingSeller } = await supabase
        .from("sellers")
        .select("username")
        .eq("username", formData.username.toLowerCase())
        .single();

      if (existingSeller) {
        setError("This username is already taken. Please choose another.");
        setLoading(false);
        return;
      }

      // Create seller record - id is the user_id (PK references auth.users)
      const { error: insertError } = await supabase.from("sellers").insert({
        id: user.id,
        username: formData.username.toLowerCase(),
        display_name: formData.display_name,
        bio: formData.bio,
        payout_email: formData.paypal_email,
        seller_status: "payouts_locked",
        commission_rate: 10.0,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          setError(
            "You already have a seller application. Check /seller for status."
          );
        } else {
          throw insertError;
        }
        return;
      }

      // Redirect to seller dashboard
      router.push("/seller?applied=true");
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-padding">
      <div className="container-wide max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Become a Seller</h1>
          <p className="text-muted">
            Start selling your digital products on our marketplace
          </p>
        </div>

        {/* Email not confirmed block */}
        {emailNotConfirmed && (
          <div className="card mb-8 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-amber-900 mb-2">
                  Email Confirmation Required
                </h2>
                <p className="text-amber-800 text-sm mb-4">
                  You must confirm your email address before you can become a
                  seller. Please check your inbox for a confirmation link.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        {!emailNotConfirmed && (
          <>
            <div className="card mb-8 bg-accent/5 border-accent/20">
              <h2 className="font-semibold mb-3">Why sell with us?</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  Reach thousands of customers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  Only 10% commission - you keep 90%
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  Secure PayPal payouts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  Customizable store page
                </li>
              </ul>
            </div>

            {/* Application Form */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Seller Application</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">
                    Store Username <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-muted mr-2">/creators/</span>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          username: e.target.value.replace(
                            /[^a-zA-Z0-9-_]/g,
                            ""
                          ),
                        })
                      }
                      placeholder="your-store-name"
                      required
                      pattern="[a-zA-Z0-9-_]+"
                      minLength={3}
                      maxLength={30}
                      className="input flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Letters, numbers, hyphens and underscores only. 3-30
                    characters.
                  </p>
                </div>

                <div>
                  <label className="label">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) =>
                      setFormData({ ...formData, display_name: e.target.value })
                    }
                    placeholder="Your Brand Name"
                    required
                    maxLength={50}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Bio / Description</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Tell customers about yourself and what you sell..."
                    rows={3}
                    maxLength={500}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    PayPal Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.paypal_email}
                    onChange={(e) =>
                      setFormData({ ...formData, paypal_email: e.target.value })
                    }
                    placeholder="your-paypal@email.com"
                    required
                    className="input"
                  />
                  <p className="text-xs text-muted mt-1">
                    We'll send your earnings to this PayPal account
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </form>

              <p className="text-xs text-muted text-center mt-4">
                Applications are typically reviewed within 24-48 hours
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
