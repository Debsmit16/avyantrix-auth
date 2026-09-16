"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Users,
  CheckCircle2,
  XCircle,
  Shield,
  Search,
  ExternalLink,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AdminPage() {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"users" | "verifications" | "audit">("verifications");

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Verifications State
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Feedback State
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!loading && (!user || !hasRole("ADMIN"))) {
      router.push("/dashboard");
      return;
    }
  }, [user, loading, hasRole, router]);

  const loadVerifications = async () => {
    setLoadingVerifications(true);
    try {
      const res = await fetch("/api/v1/admin/verifications?status=PENDING");
      const data = await res.json();
      if (data.requests) setVerifications(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/v1/admin/users?q=${encodeURIComponent(userSearch)}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch("/api/v1/admin/audit-logs?type=security");
      const data = await res.json();
      if (data.events) setAuditLogs(data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (user && hasRole("ADMIN")) {
      if (activeTab === "verifications") loadVerifications();
      if (activeTab === "users") loadUsers();
      if (activeTab === "audit") loadAuditLogs();
    }
  }, [user, hasRole, activeTab]);

  const handleReview = async (requestId: string, decision: "VERIFIED" | "REJECTED") => {
    const reviewNotes = prompt(`Enter optional review notes for ${decision}:`) || "";
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/v1/admin/verifications/${requestId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Review failed.");
      } else {
        setActionSuccess(`Request ${decision.toLowerCase()} successfully.`);
        loadVerifications();
      }
    } catch (err) {
      setActionError("Network error.");
    }
  };

  const handleToggleStatus = async (targetUserId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/users/${targetUserId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setActionSuccess(`User status updated to ${newStatus}.`);
        loadUsers();
      }
    } catch (err) {
      setActionError("Failed to update status.");
    }
  };

  if (loading || !user || !hasRole("ADMIN")) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            Avyantrix Admin Console
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Super-admin control center for identity moderation, verification review, and security logs
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setActiveTab("verifications")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "verifications"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
            Verification Queue
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "users"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-zinc-500" />
            User Management
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "audit"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-zinc-500" />
            Audit Logs
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-xs font-medium text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tab 1: Verification Queue */}
      {activeTab === "verifications" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
            Pending Capability Reviews ({verifications.length})
          </h2>

          {loadingVerifications ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-red-500" />
            </div>
          ) : verifications.length > 0 ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {verifications.map((req) => (
                <div key={req.id} className="py-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {req.user.profile?.firstName} {req.user.profile?.lastName}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          (@{req.user.profile?.username})
                        </span>
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                          {req.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{req.user.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(req.id, "VERIFIED")}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Issue Badge
                      </button>
                      <button
                        onClick={() => handleReview(req.id, "REJECTED")}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>

                  {req.notes && (
                    <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                      <strong>Submission Note:</strong> {req.notes}
                    </div>
                  )}

                  {/* Private Evidence Items List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Private Evidence Links ({req.evidence.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {req.evidence.map((ev: any) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div>
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                              {ev.title}
                            </span>
                            <span className="block text-[10px] text-zinc-500">{ev.evidenceType}</span>
                          </div>
                          {ev.evidenceUrl && (
                            <a
                              href={ev.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline dark:text-red-400"
                            >
                              Inspect <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              No pending verification requests in the queue.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === "users" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                placeholder="Search username, email, name..."
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <button
              onClick={loadUsers}
              className="rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950"
            >
              Search
            </button>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase">
                  <tr>
                    <th className="py-3 px-2">User</th>
                    <th className="py-3 px-2">Email / Status</th>
                    <th className="py-3 px-2">Roles</th>
                    <th className="py-3 px-2">Active Sessions</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-2">
                        <span className="font-semibold text-zinc-900 dark:text-white block">
                          {u.profile?.firstName} {u.profile?.lastName}
                        </span>
                        <span className="text-zinc-400 text-[11px]">@{u.profile?.username}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="block text-zinc-700 dark:text-zinc-300">{u.email}</span>
                        <span
                          className={`inline-block rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                            u.status === "ACTIVE"
                              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r: string) => (
                            <span
                              key={r}
                              className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2">{u.activeSessionsCount} active</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className="text-xs text-red-600 hover:underline dark:text-red-400"
                        >
                          {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Security Audit Trail */}
      {activeTab === "audit" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
            Security Event Audit Logs
          </h2>

          {loadingAudit ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase">
                  <tr>
                    <th className="py-3 px-2">Timestamp</th>
                    <th className="py-3 px-2">Event Type</th>
                    <th className="py-3 px-2">IP Address</th>
                    <th className="py-3 px-2">Metadata Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                  {auditLogs.map((ev) => (
                    <tr key={ev.id}>
                      <td className="py-2.5 px-2 text-zinc-500">{formatDateTime(ev.createdAt)}</td>
                      <td className="py-2.5 px-2 font-semibold text-zinc-900 dark:text-white">
                        {ev.eventType}
                      </td>
                      <td className="py-2.5 px-2 text-zinc-500">{ev.ipAddress || "—"}</td>
                      <td className="py-2.5 px-2 text-[11px] text-zinc-400">
                        {JSON.stringify(ev.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
