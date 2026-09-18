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
  AlertTriangle,
  KeyRound,
  Plus,
  Copy,
  Trash2,
  Key,
  Globe,
  Layers,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type LineupCategory = "ALL" | "CAPABILITY_BUILDER" | "MENTOR" | "PROBLEM_OWNER" | "CHALLENGE_ORGANIZER" | "EDUCATION" | "IDENTITY";
type StatusFilter = "PENDING" | "VERIFIED" | "REJECTED" | "ALL";

export default function AdminPage() {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"verifications" | "users" | "apps" | "audit">("verifications");

  // Verification Lineup State
  const [selectedLineup, setSelectedLineup] = useState<LineupCategory>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("PENDING");
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // OAuth Clients State
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [newAppModalOpen, setNewAppModalOpen] = useState(false);
  const [newAppLoading, setNewAppLoading] = useState(false);
  const [newAppForm, setNewAppForm] = useState({
    clientId: "",
    name: "",
    redirectUris: "",
    allowedOrigins: "",
    isFirstParty: true,
    isConfidential: true,
  });
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<{
    isOpen: boolean;
    clientId: string;
    name: string;
    rawClientSecret: string | null;
  }>({
    isOpen: false,
    clientId: "",
    name: "",
    rawClientSecret: null,
  });
  const [deleteClientModal, setDeleteClientModal] = useState<{
    isOpen: boolean;
    client: any | null;
  }>({
    isOpen: false,
    client: null,
  });
  const [deleteClientLoading, setDeleteClientLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

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

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const res = await fetch("/api/v1/admin/oauth-clients");
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClients(false);
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
      if (activeTab === "apps") loadClients();
      if (activeTab === "audit") loadAuditLogs();
    }
  }, [user, hasRole, activeTab, selectedLineup, selectedStatus]);

  // Custom Modal States for Admin Actions
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    reqItem: any | null;
    decision: "VERIFIED" | "REJECTED";
    reviewNotes: string;
  }>({
    isOpen: false,
    reqItem: null,
    decision: "VERIFIED",
    reviewNotes: "",
  });
  const [reviewLoading, setReviewLoading] = useState(false);

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    targetUserId: string;
    targetUsername: string;
    newStatus: "ACTIVE" | "SUSPENDED";
  }>({
    isOpen: false,
    targetUserId: "",
    targetUsername: "",
    newStatus: "ACTIVE",
  });
  const [statusLoading, setStatusLoading] = useState(false);

  const openReviewModal = (reqItem: any, decision: "VERIFIED" | "REJECTED") => {
    setReviewModal({
      isOpen: true,
      reqItem,
      decision,
      reviewNotes: "",
    });
  };

  const executeReview = async () => {
    if (!reviewModal.reqItem) return;
    setReviewLoading(true);
    setActionError("");
    setActionSuccess("");

    const { reqItem, decision, reviewNotes } = reviewModal;
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

    try {
      const res = await fetch(`/api/v1/admin/verifications/${reqItem.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNotes: reviewNotes.trim() || null }),
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
        setReviewModal({ isOpen: false, reqItem: null, decision: "VERIFIED", reviewNotes: "" });
        loadVerifications();
      }
    } catch (err) {
      setActionError("Network error executing review.");
    } finally {
      setReviewLoading(false);
    }
  };

  const openStatusModal = (targetUserId: string, currentStatus: string, targetUsername: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setStatusModal({
      isOpen: true,
      targetUserId,
      targetUsername,
      newStatus,
    });
  };

  const executeToggleStatus = async () => {
    if (!statusModal.targetUserId) return;
    setStatusLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/v1/admin/users/${statusModal.targetUserId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusModal.newStatus }),
      });

      if (res.ok) {
        setActionSuccess(`User @${statusModal.targetUsername} status updated to ${statusModal.newStatus}.`);
        setStatusModal({ isOpen: false, targetUserId: "", targetUsername: "", newStatus: "ACTIVE" });
        loadUsers();
      } else {
        const data = await res.json();
        setActionError(data.error || "Failed to update status.");
      }
    } catch (err) {
      setActionError("Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleToggleUserRole = async (targetUserId: string, currentRoles: string[], roleToToggle: string) => {
    const newRoles = currentRoles.includes(roleToToggle)
      ? currentRoles.filter((r) => r !== roleToToggle)
      : [...currentRoles, roleToToggle];

    if (newRoles.length === 0) {
      setActionError("A user must have at least one assigned role.");
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

  // Create OAuth Application
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewAppLoading(true);
    setActionError("");
    setActionSuccess("");

    const redirectUris = newAppForm.redirectUris
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    const allowedOrigins = newAppForm.allowedOrigins
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/v1/admin/oauth-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: newAppForm.clientId.trim().toLowerCase(),
          name: newAppForm.name.trim(),
          redirectUris,
          allowedOrigins,
          isFirstParty: newAppForm.isFirstParty,
          isConfidential: newAppForm.isConfidential,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to create application.");
      } else {
        setNewAppModalOpen(false);
        setNewAppForm({
          clientId: "",
          name: "",
          redirectUris: "",
          allowedOrigins: "",
          isFirstParty: true,
          isConfidential: true,
        });
        loadClients();
        if (data.rawClientSecret) {
          setCreatedCredentialsModal({
            isOpen: true,
            clientId: data.client.clientId,
            name: data.client.name,
            rawClientSecret: data.rawClientSecret,
          });
        } else {
          setActionSuccess(`OAuth Application '${data.client.name}' registered successfully.`);
        }
      }
    } catch (err) {
      setActionError("Network error creating OAuth client.");
    } finally {
      setNewAppLoading(false);
    }
  };

  // Delete OAuth Application
  const executeDeleteClient = async () => {
    if (!deleteClientModal.client) return;
    setDeleteClientLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/v1/admin/oauth-clients/${deleteClientModal.client.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to delete client.");
      } else {
        setActionSuccess(data.message || "Application deleted.");
        setDeleteClientModal({ isOpen: false, client: null });
        loadClients();
      }
    } catch (err) {
      setActionError("Network error deleting application.");
    } finally {
      setDeleteClientLoading(false);
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
            Moderation center for multi-role verification queues, RBAC role provisioning, OAuth applications, and identity audit streams
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900 flex-wrap">
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
            <Users className="h-3.5 w-3.5 text-red-500" />
            User Management
          </button>

          <button
            onClick={() => setActiveTab("apps")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "apps"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 text-red-500" />
            OAuth Apps
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "audit"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-red-500" />
            Security Audit
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedLineup("ALL")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedLineup === "ALL"
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                All Tracks
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
                            onClick={() => openReviewModal(req, "VERIFIED")}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
                          >
                            <BadgeCheck className="h-3.5 w-3.5" /> Approve & Grant Role
                          </button>
                          <button
                            onClick={() => openReviewModal(req, "REJECTED")}
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
                              className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 text-xs"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-zinc-900 dark:text-white block truncate">
                                  {ev.title}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {ev.evidenceType}
                                </span>
                              </div>

                              {ev.evidenceUrl && (
                                <a
                                  href={ev.evidenceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="shrink-0 inline-flex items-center gap-1 rounded bg-zinc-200/60 hover:bg-zinc-200 px-2 py-1 text-[11px] font-semibold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                                >
                                  View <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                No verification requests matching the selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === "users" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              User Roster & Persona Governance ({users.length})
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search username, email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
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
                    <th className="py-3 px-2">Email & Status</th>
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
                          onClick={() => openStatusModal(u.id, u.status, u.profile?.username || u.email)}
                          className="text-xs text-red-600 hover:underline dark:text-red-400 font-medium"
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

      {/* Tab 3: OAuth Applications Manager */}
      {activeTab === "apps" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-red-500" />
                Registered OAuth 2.0 / OIDC Applications ({clients.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage ecosystem products (Builds, Challenges) and third-party developer integrations
              </p>
            </div>

            <button
              onClick={() => setNewAppModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> Register New Application
            </button>
          </div>

          {loadingClients ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-red-500" />
            </div>
          ) : clients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase">
                  <tr>
                    <th className="py-3 px-2">Application Name & Client ID</th>
                    <th className="py-3 px-2">Redirect URIs & Allowed Origins</th>
                    <th className="py-3 px-2">Type & Security</th>
                    <th className="py-3 px-2">Activity Stats</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-2">
                        <span className="font-bold text-zinc-900 dark:text-white block">{c.name}</span>
                        <span className="font-mono text-xs text-red-600 dark:text-red-400 select-all">
                          {c.clientId}
                        </span>
                      </td>
                      <td className="py-3 px-2 max-w-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Redirects:</span>
                          {c.redirectUris.map((uri: string, idx: number) => (
                            <span key={idx} className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 block truncate">
                              {uri}
                            </span>
                          ))}
                          {c.allowedOrigins.length > 0 && (
                            <>
                              <span className="text-[10px] text-zinc-400 font-semibold uppercase block pt-1">Origins:</span>
                              <span className="font-mono text-[10px] text-zinc-500 block truncate">
                                {c.allowedOrigins.join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              c.isFirstParty
                                ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                            }`}
                          >
                            {c.isFirstParty ? "First-Party (Auto-Consent)" : "Third-Party (Prompt)"}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            {c.isConfidential ? "🔒 Confidential (Secret)" : "🔓 Public (PKCE S256)"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                        <div>Codes: {c.stats.totalCodes}</div>
                        <div>Refresh Tokens: {c.stats.activeRefreshTokens}</div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => setDeleteClientModal({ isOpen: true, client: c })}
                          className="text-xs text-red-600 hover:underline dark:text-red-400 font-medium"
                        >
                          Revoke App
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              No OAuth applications registered yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
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

      {/* MODAL: Custom Verification Review Dialog */}
      {reviewModal.isOpen && reviewModal.reqItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                {reviewModal.decision === "VERIFIED" ? (
                  <BadgeCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {reviewModal.decision === "VERIFIED"
                    ? "Approve Verification Request"
                    : "Reject Verification Request"}
                </h3>
              </div>
              <button
                onClick={() => setReviewModal({ isOpen: false, reqItem: null, decision: "VERIFIED", reviewNotes: "" })}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 space-y-1">
              <p>
                <span className="font-semibold text-zinc-900 dark:text-white">Applicant:</span>{" "}
                {reviewModal.reqItem.user.profile?.firstName} {reviewModal.reqItem.user.profile?.lastName} (@{reviewModal.reqItem.user.profile?.username || reviewModal.reqItem.user.email})
              </p>
              <p>
                <span className="font-semibold text-zinc-900 dark:text-white">Track:</span>{" "}
                {reviewModal.reqItem.category}
              </p>
              <p className="text-[11px] text-zinc-500">
                {reviewModal.decision === "VERIFIED"
                  ? "Approving will automatically assign the official role & badge, and send a congratulatory email."
                  : "Rejecting will notify the applicant via email with your feedback so they can resubmit."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Reviewer Feedback / Decision Notes {reviewModal.decision === "REJECTED" && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={3}
                value={reviewModal.reviewNotes}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, reviewNotes: e.target.value }))}
                placeholder={
                  reviewModal.decision === "VERIFIED"
                    ? "e.g. Excellent open source contributions and clear repository evidence."
                    : "e.g. The repository link was private. Please provide a public link or deployed URL."
                }
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setReviewModal({ isOpen: false, reqItem: null, decision: "VERIFIED", reviewNotes: "" })}
                className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeReview}
                disabled={reviewLoading}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                  reviewModal.decision === "VERIFIED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {reviewLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {reviewModal.decision === "VERIFIED" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Custom User Status Toggle Dialog */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {statusModal.newStatus === "SUSPENDED" ? "Suspend User Account?" : "Reactivate User Account?"}
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              {statusModal.newStatus === "SUSPENDED"
                ? `Are you sure you want to suspend @${statusModal.targetUsername}? Their active sessions will be terminated and they will be blocked from logging in.`
                : `Are you sure you want to restore active status for @${statusModal.targetUsername}?`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setStatusModal({ isOpen: false, targetUserId: "", targetUsername: "", newStatus: "ACTIVE" })}
                className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeToggleStatus}
                disabled={statusLoading}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                  statusModal.newStatus === "SUSPENDED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {statusLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {statusModal.newStatus === "SUSPENDED" ? "Suspend Account" : "Reactivate Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register New OAuth Application */}
      {newAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Register New OAuth 2.0 Application
                </h3>
              </div>
              <button
                onClick={() => setNewAppModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avyantrix Challenges"
                  value={newAppForm.name}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Client ID (lowercase, hyphens/underscores)
                </label>
                <input
                  type="text"
                  required
                  pattern="[a-z0-9_-]+"
                  placeholder="e.g. avyantrix_challenges"
                  value={newAppForm.clientId}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, clientId: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Redirect Callback URIs (one per line)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="https://challenges.avyantrix.com/api/auth/callback"
                  value={newAppForm.redirectUris}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, redirectUris: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Allowed CORS Origins (one per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="https://challenges.avyantrix.com"
                  value={newAppForm.allowedOrigins}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, allowedOrigins: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-6 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newAppForm.isFirstParty}
                    onChange={(e) => setNewAppForm((prev) => ({ ...prev, isFirstParty: e.target.checked }))}
                    className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
                  />
                  <span>First-Party (Skip Consent)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newAppForm.isConfidential}
                    onChange={(e) => setNewAppForm((prev) => ({ ...prev, isConfidential: e.target.checked }))}
                    className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
                  />
                  <span>Confidential (Generate Secret)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNewAppModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newAppLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {newAppLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Register Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Newly Created Application Credentials */}
      {createdCredentialsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Application Credentials Generated
              </h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Save your Client Secret now. For security, it is stored as an Argon2id hash and <strong>will never be displayed again</strong>:
            </p>

            <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800/80">
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Client ID</span>
                <span className="text-zinc-900 dark:text-white font-bold select-all">
                  {createdCredentialsModal.clientId}
                </span>
              </div>

              {createdCredentialsModal.rawClientSecret && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Client Secret</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-red-600 dark:text-red-400 font-bold select-all break-all">
                      {createdCredentialsModal.rawClientSecret}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentialsModal.rawClientSecret || "");
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                      className="shrink-0 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                      title="Copy Secret"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {copiedSecret && (
              <p className="text-[11px] font-semibold text-green-600 dark:text-green-400 text-center">
                Copied to clipboard!
              </p>
            )}

            <button
              type="button"
              onClick={() => setCreatedCredentialsModal({ isOpen: false, clientId: "", name: "", rawClientSecret: null })}
              className="w-full rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              I have saved my Client Secret
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Revoke OAuth Client Confirmation */}
      {deleteClientModal.isOpen && deleteClientModal.client && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600">
              <Trash2 className="h-5 w-5" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Revoke OAuth Application?
              </h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Are you sure you want to revoke <strong>{deleteClientModal.client.name}</strong> (<code>{deleteClientModal.client.clientId}</code>)? All active tokens and integrations using this client will stop working immediately.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteClientModal({ isOpen: false, client: null })}
                className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteClient}
                disabled={deleteClientLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteClientLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Revoke Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
