"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    userType: "individual" as "individual" | "business",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: formData.userType,
          },
        },
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes("already registered")) {
          setError(
            "This email is already registered. Please try logging in or use a different email."
          );
        } else {
          setError(authError.message);
        }
        return;
      }

      // Supabase returns a user object but with empty identities when email exists
      // This is a security measure to prevent email enumeration
      if (
        authData.user &&
        authData.user.identities &&
        authData.user.identities.length === 0
      ) {
        setError(
          "This email is already registered. Please try logging in or use a different email."
        );
        return;
      }

      if (authData.user) {
        // Create profile with email_confirmed status
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          user_type: formData.userType,
          email_confirmed: false, // Force false to require manual verification logic
        });

        if (profileError && profileError.code !== "23505") {
          console.error("Profile error:", profileError);
        }

        // Sign out immediately to prevent auto-login
        await supabase.auth.signOut();

        // Show success message and clear form
        setSuccess(
          "Account created successfully! Please check your email to confirm your account before logging in."
        );
        setFormData({
          email: "",
          password: "",
          fullName: "",
          userType: "individual",
        });

        // Scroll to top to see success message
        window.scrollTo(0, 0);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
              <div>
                <p className="font-medium">Account Created Successfully!</p>
                <p className="mt-1">{success}</p>
                <Link
                  href="/login"
                  className="mt-2 inline-block text-green-700 underline hover:text-green-900"
                >
                  Go to Login →
                </Link>
              </div>
            </div>
          </div>
        )}

        <Input
          label="Full Name"
          type="text"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          placeholder="John Doe"
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="••••••••"
          hint="Minimum 6 characters"
          required
        />

        {/* User Type Selection */}
        <div>
          <label className="label">Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, userType: "individual" })
              }
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                formData.userType === "individual"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className={`w-5 h-5 ${
                    formData.userType === "individual"
                      ? "text-accent"
                      : "text-muted"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium text-sm">Individual</span>
              </div>
              <p className="text-xs text-muted">Personal use (B2C)</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, userType: "business" })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                formData.userType === "business"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className={`w-5 h-5 ${
                    formData.userType === "business"
                      ? "text-accent"
                      : "text-muted"
                  }`}
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
                <span className="font-medium text-sm">Business</span>
              </div>
              <p className="text-xs text-muted">Commercial use (B2B)</p>
            </button>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create Account
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-muted">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-medium">Continue with Google</span>
      </button>

      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
