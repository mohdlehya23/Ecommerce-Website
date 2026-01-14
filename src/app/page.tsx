
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .limit(6)
    .order("created_at", { ascending: false });

  const products = (featuredProducts as Product[]) || [];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-50" />

        <div className="container-wide relative section-padding">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent-300 rounded-full text-sm font-medium mb-6">
              Premium Digital Products
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Transform Your Business with{" "}
              <span className="text-accent">Digital Excellence</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-200 mb-8 max-w-2xl mx-auto">
              Discover premium ebooks, templates, and consulting services
              designed to accelerate your success. For individuals and
              businesses alike.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="btn-primary text-lg px-8 py-4">
                Browse Products
              </Link>
              <Link
                href="/products?category=consulting"
                className="btn-outline border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4"
              >
                Book Consulting
              </Link>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Explore Our Categories
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Find the perfect digital products to meet your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ebooks */}
            <Link href="/products?category=ebooks" className="group">
              <div className="card text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-xl mb-2 group-hover:text-accent transition-colors">
                  Ebooks
                </h3>
                <p className="text-muted text-sm">
                  In-depth guides and resources to expand your knowledge
                </p>
              </div>
            </Link>

            {/* Templates */}
            <Link href="/products?category=templates" className="group">
              <div className="card text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-xl mb-2 group-hover:text-accent transition-colors">
                  Templates
                </h3>
                <p className="text-muted text-sm">
                  Ready-to-use templates to jumpstart your projects
                </p>
              </div>
            </Link>

            {/* Consulting */}
            <Link href="/products?category=consulting" className="group">
              <div className="card text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-xl mb-2 group-hover:text-accent transition-colors">
                  Consulting
                </h3>
                <p className="text-muted text-sm">
                  Expert guidance tailored to your specific needs
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding bg-gray-50">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Featured Products
              </h2>
              <p className="text-muted max-w-xl">
                Our most popular digital products, carefully curated for you
              </p>
            </div>
            <Link href="/products" className="btn-outline mt-4 md:mt-0">
              View All Products
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-muted">
                No products available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure Payments</h3>
              <p className="text-muted text-sm">
                All transactions are secured with PayPal protection
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Instant Delivery</h3>
              <p className="text-muted text-sm">
                Get immediate access to your digital purchases
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
              <p className="text-muted text-sm">
                Our team is here to help whenever you need
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-accent to-accent-600">
        <div className="container-wide text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-accent-100 max-w-2xl mx-auto mb-8">
            Join thousands of satisfied customers who have transformed their
            businesses with our premium digital products.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-accent font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </>
  );
}
