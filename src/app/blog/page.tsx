import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blog | Digital Store",
  description:
    "Discover tips, guides, and insights for digital creators, freelancers, and businesses.",
};

const categories = [
  { id: "all", label: "All" },
  { id: "business-growth", label: "Business Growth" },
  { id: "freelancer-tips", label: "Freelancer Tips" },
  { id: "digital-tools", label: "Digital Tools" },
  { id: "digital-marketing", label: "Digital Marketing" },
  { id: "product-building", label: "Product Building" },
];

const posts = [
  {
    id: "1",
    title: "10 Essential Digital Products Every Freelancer Should Sell",
    excerpt:
      "Discover the most profitable digital products you can create and sell as a freelancer to build passive income streams.",
    category: "freelancer-tips",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600",
    date: "January 5, 2026",
    readTime: "8 min read",
  },
  {
    id: "2",
    title: "How to Price Your Digital Products for Maximum Profit",
    excerpt:
      "Learn proven pricing strategies that help you maximize revenue while providing value to your customers.",
    category: "business-growth",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
    date: "January 3, 2026",
    readTime: "6 min read",
  },
  {
    id: "3",
    title: "The Complete Guide to Selling Templates Online",
    excerpt:
      "Everything you need to know about creating, packaging, and selling templates on digital marketplaces.",
    category: "product-building",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600",
    date: "January 1, 2026",
    readTime: "12 min read",
  },
  {
    id: "4",
    title: "Email Marketing Automation for Digital Product Sellers",
    excerpt:
      "Set up automated email sequences that nurture leads and convert them into paying customers.",
    category: "digital-marketing",
    image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600",
    date: "December 28, 2025",
    readTime: "10 min read",
  },
  {
    id: "5",
    title: "Best Tools for Creating and Selling Ebooks in 2026",
    excerpt:
      "A curated list of the best software and platforms for writing, designing, and selling ebooks.",
    category: "digital-tools",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
    date: "December 25, 2025",
    readTime: "7 min read",
  },
  {
    id: "6",
    title: "Building a Personal Brand as a Digital Creator",
    excerpt:
      "Step-by-step guide to establishing your unique brand identity and standing out in crowded markets.",
    category: "business-growth",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600",
    date: "December 22, 2025",
    readTime: "9 min read",
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Header */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary-700 to-primary-800 text-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-lg text-primary-200">
              Insights, tips, and guides for digital creators and entrepreneurs.
            </p>
          </div>
        </div>
      </section>

      {/* Category Chips */}
      <section className="py-6 bg-white border-b border-border">
        <div className="container-wide">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category.id === "all"
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Posts Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <article key={post.id} className="card group">
                    <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                        {categories.find((c) => c.id === post.category)?.label}
                      </span>
                      <span className="text-xs text-muted">
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">{post.date}</span>
                      <span className="text-sm text-accent group-hover:underline">
                        Read more →
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-8">
                <button className="btn-outline">Load More Posts</button>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Newsletter CTA */}
              <div className="card bg-gradient-to-br from-accent to-accent-600 text-white sticky top-24">
                <h3 className="text-xl font-bold mb-2">
                  Subscribe to Our Newsletter
                </h3>
                <p className="text-accent-100 text-sm mb-4">
                  Get the latest tips and insights delivered straight to your
                  inbox.
                </p>
                <Link
                  href="/newsletter"
                  className="block w-full py-3 px-4 bg-white text-accent font-medium rounded-lg text-center hover:bg-gray-100 transition-colors"
                >
                  Subscribe Now
                </Link>
              </div>

              {/* Popular Categories */}
              <div className="card mt-6">
                <h3 className="font-bold mb-4">Popular Categories</h3>
                <ul className="space-y-2">
                  {categories.slice(1).map((category) => (
                    <li key={category.id}>
                      <button className="text-sm text-muted hover:text-accent transition-colors">
                        {category.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Products CTA */}
              <div className="card mt-6">
                <h3 className="font-bold mb-2">Ready to start selling?</h3>
                <p className="text-sm text-muted mb-4">
                  Browse our collection of tools and templates for digital
                  creators.
                </p>
                <Link href="/products" className="btn-outline w-full text-sm">
                  Browse Products
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
