import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center section-padding">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-4">
            <span className="text-6xl font-bold text-muted">404</span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted max-w-md mx-auto mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It
          might have been moved, deleted, or never existed.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/products" className="btn-outline">
            Browse Products
          </Link>
        </div>

        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted mb-4">Need help?</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/help" className="text-accent hover:underline">
              Help Center
            </Link>
            <span className="text-border">|</span>
            <Link href="/contact" className="text-accent hover:underline">
              Contact Support
            </Link>
            <span className="text-border">|</span>
            <Link href="/faq" className="text-accent hover:underline">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
