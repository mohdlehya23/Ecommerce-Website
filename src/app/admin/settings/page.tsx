import type { Metadata } from "next";
import { AdminManagement } from "./AdminManagement";

export const metadata: Metadata = {
  title: "Settings | Admin",
  description: "Platform settings and admin management",
};

export default function AdminSettingsPage() {
  return (
    <div className="container-wide max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted">Manage platform configuration and admins</p>
      </div>

      {/* Platform Settings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Platform Configuration</h2>
        <div className="card p-6">
          <div className="space-y-4">
            <div>
              <label className="label">Default Commission Rate (%)</label>
              <input
                type="number"
                defaultValue="10"
                step="0.01"
                min="0"
                max="100"
                className="input"
                disabled
              />
              <p className="text-xs text-muted mt-1">
                Note: Commission rate is currently set in the database
                migration. To update, modify the sellers table default value.
              </p>
            </div>

            <div>
              <label className="label">PayPal Integration</label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  ✓ Connected
                </span>
                <p className="text-sm text-muted">
                  Client ID configured in environment
                </p>
              </div>
            </div>

            <div>
              <label className="label">Supabase Storage</label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  ✓ Active
                </span>
                <p className="text-sm text-muted">
                  Buckets: downloads, avatars, product-images
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Management */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Admin Management</h2>
        <AdminManagement />
      </div>

      {/* Security Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 text-sm mb-1">
              Security Features
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• All admin actions are logged in the audit table</li>
              <li>
                • Admin access uses dedicated admin_users table (not profile
                roles)
              </li>
              <li>• Last admin cannot be removed to prevent lockout</li>
              <li>• RLS policies enforce admin-only data access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
