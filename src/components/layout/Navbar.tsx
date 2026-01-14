"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { CartButton } from "@/components/cart/CartButton";

export function Navbar() {
  const { user, profile, isLoading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <nav className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="font-semibold text-xl text-primary">
              Digital Store
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/products"
              className="text-muted hover:text-primary transition-colors"
            >
              Products
            </Link>
            <Link
              href="/products?category=ebooks"
              className="text-muted hover:text-primary transition-colors"
            >
              Ebooks
            </Link>
            <Link
              href="/products?category=templates"
              className="text-muted hover:text-primary transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/products?category=consulting"
              className="text-muted hover:text-primary transition-colors"
            >
              Consulting
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <CartButton />

            {!isLoading && (
              <>
                {user ? (
                  <div className="hidden md:flex items-center gap-4">
                    <Link
                      href="/dashboard"
                      className="text-muted hover:text-primary transition-colors"
                    >
                      Dashboard
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">
                        {profile?.full_name || user.email}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                        {profile?.user_type === "business" ? "B2B" : "B2C"}
                      </span>
                    </div>
                    <button
                      onClick={signOut}
                      className="text-sm text-muted hover:text-primary transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-4">
                    <Link
                      href="/login"
                      className="text-muted hover:text-primary transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link href="/register" className="btn-primary text-sm py-2">
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-primary"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border"
            >
              <div className="py-4 space-y-4">
                <Link
                  href="/products"
                  className="block text-muted hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Products
                </Link>
                <Link
                  href="/products?category=ebooks"
                  className="block text-muted hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Ebooks
                </Link>
                <Link
                  href="/products?category=templates"
                  className="block text-muted hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Templates
                </Link>
                <Link
                  href="/products?category=consulting"
                  className="block text-muted hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Consulting
                </Link>

                <hr className="border-border" />

                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block text-muted hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block text-muted hover:text-primary transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-muted hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="block btn-primary text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
