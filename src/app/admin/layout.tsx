import { redirect } from "next/navigation";
import { isAdmin, getCurrentUser } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // No session - redirect to login
  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <Link href="/dashboard" className="btn-outline text-sm">
              Exit Admin →
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container-wide">
          <div className="flex gap-1 overflow-x-auto py-2">
            <NavLink href="/admin">Dashboard</NavLink>
            <NavLink href="/admin/products">Products</NavLink>
            <NavLink href="/admin/orders">Orders</NavLink>
            <NavLink href="/admin/sellers">Sellers</NavLink>
            <NavLink href="/admin/payouts">Payouts</NavLink>
            <NavLink href="/admin/analytics">Analytics</NavLink>
            <NavLink href="/admin/settings">Settings</NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {children}
    </Link>
  );
}
