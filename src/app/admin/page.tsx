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
  Code2,
  GraduationCap,
  Building2,
  Trophy,
  Filter,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type LineupCategory = "ALL" | "CAPABILITY_BUILDER" | "MENTOR" | "PROBLEM_OWNER" | "CHALLENGE_ORGANIZER" | "EDUCATION" | "IDENTITY";
type StatusFilter = "PENDING" | "VERIFIED" | "REJECTED" | "ALL";

export default function AdminPage() {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"verifications" | "users" | "audit">("verifications");

  // Verification Lineup State
  const [selectedLineup, setSelectedLineup] = useState<LineupCategory>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("PENDING");
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

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
      let url = `/api/v1/admin/verifications?status=${selectedStatus}`;
      if (selectedLineup !== "ALL") {
        url += `&category=${selectedLineup}`;
      }
      const res = await fetch(url);
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
  }, [user, hasRole, activeTab, selectedLineup, selectedStatus]);

  const handleReview = async (reqItem: any, decision: "VERIFIED" | "REJECTED") => {
    const roleTarget =
      reqItem.category === "CAPABILITY_BUILDER"
        ? "BUILDER"
        : reqItem.category === "MENTOR"
        ? "MENTOR"
        : reqItem.category === "PROBLEM_OWNER"
        ? "PROBLEM_OWNER"
        : reqItem.category === "CHALLENGE_ORGANIZER"
        ? "CHALLENGE_ORGANIZER"
        : reqItem.category;

    const actionText =
      decision === "VERIFIED"
        ? `Approve this submission and automatically grant '${roleTarget}' role & badge?`
        : `Reject this verification request?`;

    const reviewNotes = prompt(`${actionText}\nEnter optional review notes:`, "") ?? null;
    if (reviewNotes === null) return; // User cancelled prompt

    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/v1/admin/verifications/${reqItem.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Review failed.");
      } else {
        setActionSuccess(
          decision === "VERIFIED"
            ? `Request verified! Granted '${roleTarget}' role and issued verified badge to @${reqItem.user.profile?.username || reqItem.user.email}.`
            : `Request marked as rejected.`
        );
        loadVerifications();
      }
    } catch (err) {
      setActionError("Network error executing review.");
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

  const handleToggleUserRole = async (targetUserId: string, currentRoles: string[], roleToToggle: string) => {
    const newRoles = currentRoles.includes(roleToToggle)
      ? currentRoles.filter((r) => r !== roleToToggle)
      : [...currentRoles, roleToToggle];

    if (newRoles.length === 0) {
      alert("A user must have at least one assigned role.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${targetUserId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: newRoles }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to update user roles.");
      } else {
        setActionSuccess(`Updated roles for user: [${newRoles.join(", ")}]`);
        loadUsers();
      }
    } catch (err) {
      setActionError("Network error updating roles.");
    }
  };

  if (loading || !user || !hasRole("ADMIN")) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Helper to get category count in current view
  const getLineupIcon = (cat: LineupCategory) => {
    switch (cat) {
      case "CAPABILITY_BUILDER":
        return <Code2 className="h-3.5 w-3.5 text-red-500" />;
      case "MENTOR":
        return <GraduationCap className="h-3.5 w-3.5 text-blue-500" />;
      case "PROBLEM_OWNER":
        return <Building2 className="h-3.5 w-3.5 text-amber-500" />;
      case "CHALLENGE_ORGANIZER":
        return <Trophy className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <Shield className="h-3.5 w-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            Avyantrix Super-Admin Console
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Moderation center for multi-role verification queues, RBAC role provisioning, and identity audit streams
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
            Verification Lineup
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
            User RBAC
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

      {/* Tab 1: Segregated Verification Queue Lineup */}
      {activeTab === "verifications" && (
        <div className="space-y-4">
          {/* Lineup Category Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-2">Lineup:</span>
              
              <button
                onClick={() => setSelectedLineup("ALL")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedLineup === "ALL"
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                All Submissions
              </button>

              <button
                onClick={() => setSelectedLineup("CAPABILITY_BUILDER")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedLineup === "CAPABILITY_BUILDER"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" /> Builders
              </button>

              <button
                onClick={() => setSelectedLineup("MENTOR")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedLineup === "MENTOR"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" /> Mentors
              </button>

              <button
                onClick={() => setSelectedLineup("PROBLEM_OWNER")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedLineup === "PROBLEM_OWNER"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" /> Problem Owners
              </button>

              <button
                onClick={() => setSelectedLineup("CHALLENGE_ORGANIZER")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedLineup === "CHALLENGE_ORGANIZER"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <Trophy className="h-3.5 w-3.5" /> Organizers
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
                className="rounded-lg border border-zinc-200 bg-white py-1 px-2.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="PENDING">Pending Review</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="REJECTED">Rejected Only</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          </div>

          {/* Submissions Queue Container */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                {getLineupIcon(selectedLineup)}
                {selectedLineup === "ALL" ? "All Verification Submissions" : `${selectedLineup} Review Queue`} ({verifications.length})
              </h2>
              <span className="text-xs text-zinc-400">
                Approving automatically assigns RBAC roles and issues public verification badges.
              </span>
            </div>

            {loadingVerifications ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-red-500" />
              </div>
            ) : verifications.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {verifications.map((req) => (
                  <div key={req.id} className="py-6 space-y-4">
                    {/* User & Action Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">
                            {req.user.profile?.firstName} {req.user.profile?.lastName}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            (@{req.user.profile?.username})
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              req.category === "CAPABILITY_BUILDER"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                : req.category === "MENTOR"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                : req.category === "PROBLEM_OWNER"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : req.category === "CHALLENGE_ORGANIZER"
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            Track: {req.category}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              req.status === "VERIFIED"
                                ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                : req.status === "REJECTED"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {req.user.email} &bull; Submitted {formatDateTime(req.createdAt)}
                        </p>
                        
                        {/* Current User Roles */}
                        {req.user.userRoles && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase">Current Roles:</span>
                            {req.user.userRoles.map((ur: any) => (
                              <span
                                key={ur.role?.name || ur.roleId}
                                className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.2 text-[9px] font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                              >
                                {ur.role?.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {req.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReview(req, "VERIFIED")}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
                          >
                            <BadgeCheck className="h-3.5 w-3.5" /> Approve & Grant Role
                          </button>
                          <button
                            onClick={() => handleReview(req, "REJECTED")}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Submission Details / Notes */}
                    {req.notes && (
                      <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3.5 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                        {req.notes}
                      </div>
                    )}

                    {/* Private Evidence Links */}
                    {req.evidence && req.evidence.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Submitted Proof Artifacts & Verification Links ({req.evidence.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {req.evidence.map((ev: any) => (
                            <div
                              key={ev.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              <div className="pr-2">
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                                  {ev.title}
                                </span>
                                <span className="text-[10px] text-zinc-500">{ev.evidenceType}</span>
                              </div>
                              {ev.evidenceUrl && (
                                <a
                                  href={ev.evidenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:bg-zinc-800 dark:text-red-400 transition-colors shrink-0"
                                >
                                  Inspect <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {req.reviewNotes && (
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        <strong>Review Feedback:</strong> {req.reviewNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-400">
                No submissions found matching the selected lineup and status filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: User RBAC Management */}
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
              Search Users
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
                    <th className="py-3 px-2">User Handle</th>
                    <th className="py-3 px-2">Email / Status</th>
                    <th className="py-3 px-2">Assigned Roles (Click to Toggle)</th>
                    <th className="py-3 px-2">Active Sessions</th>
                    <th className="py-3 px-2 text-right">Moderation</th>
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          {["BUILDER", "MENTOR", "PROBLEM_OWNER", "CHALLENGE_ORGANIZER", "ADMIN"].map((rName) => {
                            const isAssigned = u.roles.includes(rName);
                            return (
                              <button
                                key={rName}
                                onClick={() => handleToggleUserRole(u.id, u.roles, rName)}
                                title={isAssigned ? `Click to revoke ${rName}` : `Click to grant ${rName}`}
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold transition-all border ${
                                  isAssigned
                                    ? rName === "ADMIN"
                                      ? "border-red-500 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                      : rName === "MENTOR"
                                      ? "border-blue-400 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : rName === "PROBLEM_OWNER"
                                      ? "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : rName === "CHALLENGE_ORGANIZER"
                                      ? "border-purple-400 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                      : "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                    : "border-dashed border-zinc-300 bg-transparent text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:text-zinc-600 dark:hover:text-zinc-400"
                                }`}
                              >
                                {isAssigned ? "✓ " : "+ "}
                                {rName}
                              </button>
                            );
                          })}
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
