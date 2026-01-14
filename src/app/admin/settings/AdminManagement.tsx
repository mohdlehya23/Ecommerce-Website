"use client";

import { useState, useEffect } from "react";

interface Admin {
  user_id: string;
  email: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  before: any;
  after: any;
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch admins and audit logs
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/admin-users");
      if (!response.ok) throw new Error("Failed to fetch admins");
      const data = await response.json();
      setAdmins(data.admins);
    } catch (err) {
      setError("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAddLoading(true);

    try {
      const response = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add admin");
      }

      setSuccess(`Admin added successfully: ${email}`);
      setEmail("");
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const removeAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;

    setError("");
    setSuccess("");
    setRemoveLoading(userId);

    try {
      const response = await fetch(`/api/admin/admin-users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove admin");
      }

      setSuccess("Admin removed successfully");
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRemoveLoading(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const canRemoveAdmin = admins.length > 1;

  return (
    <div className="space-y-8">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Add Admin Form */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>
        <form onSubmit={addAdmin} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user email"
            required
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={addLoading}
            className="btn-primary px-6"
          >
            {addLoading ? "Adding..." : "Add Admin"}
          </button>
        </form>
        <p className="text-xs text-muted mt-2">
          Enter the email of an existing user to grant them admin access
        </p>
      </div>

      {/* Admins List */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">
          Current Admins ({admins.length})
        </h3>
        {admins.length === 0 ? (
          <p className="text-muted text-sm">No admins found</p>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.user_id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{admin.email}</p>
                  <p className="text-xs text-muted">
                    Added: {new Date(admin.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeAdmin(admin.user_id)}
                  disabled={!canRemoveAdmin || removeLoading === admin.user_id}
                  className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !canRemoveAdmin
                      ? "Cannot remove the last admin"
                      : "Remove admin"
                  }
                >
                  {removeLoading === admin.user_id ? "..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
        {!canRemoveAdmin && (
          <p className="text-xs text-yellow-700 bg-yellow-50 px-3 py-2 rounded mt-3">
            ⚠️ Cannot remove the last admin to prevent lockout
          </p>
        )}
      </div>
    </div>
  );
}
