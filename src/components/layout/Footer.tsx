"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (error) {
        if (error.code === "23505") {
          setMessage({ type: "error", text: "You're already subscribed!" });
        } else {
          throw error;
        }
      } else {
        setMessage({ type: "success", text: "Thanks for subscribing!" });
        setEmail("");
      }
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-primary text-white">
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="font-semibold text-xl">Digital Store</span>
            </div>
            <p className="text-primary-200 text-sm leading-relaxed">
              Premium digital products and services for individuals and
              businesses. Quality resources to accelerate your success.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products?category=ebooks"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  Ebooks
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=templates"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  Templates
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=consulting"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  Consulting
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/business"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  For Business
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/dashboard"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-primary-200 hover:text-white transition-colors text-sm"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Stay Updated</h4>
            <p className="text-primary-200 text-sm mb-4">
              Get notified about new products and exclusive offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-primary-600 border border-primary-500 
                         text-white placeholder:text-primary-300
                         focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                         text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary text-sm py-2.5"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
              {message && (
                <p
                  className={`text-sm ${
                    message.type === "success" ? "text-accent" : "text-red-400"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-600 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-300 text-sm">
            © {new Date().getFullYear()} Digital Store. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="text-primary-300 hover:text-white transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-primary-300 hover:text-white transition-colors text-sm"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
