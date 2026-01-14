"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const supabase = createClient();

      // Check if email already exists
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("id")
        .eq("email", email)
        .single();

      if (existing) {
        setStatus("success");
        setEmail("");
        return;
      }

      // Insert new subscriber
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (error) {
        throw error;
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Success Alert */}
      {status === "success" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-left">
          <div className="flex items-center gap-2 text-green-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">You&apos;re subscribed!</span>
          </div>
          <p className="text-green-600 text-sm mt-1">
            Thank you for subscribing. Check your inbox for a welcome email.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {status === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-left">
          <div className="flex items-center gap-2 text-red-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {status !== "success" && (
        <>
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input text-center"
              placeholder="Enter your email address"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Subscribing...
              </span>
            ) : (
              "Subscribe"
            )}
          </button>
        </>
      )}
    </form>
  );
}
