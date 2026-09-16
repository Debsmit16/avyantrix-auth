"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  KeyRound,
  Shield,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function SecurityPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // Action status
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadSecurityData = async () => {
    try {
      const [sessionsRes, meRes] = await Promise.all([
        fetch("/api/v1/auth/sessions"),
        fetch("/api/v1/me"),
      ]);

      const sData = await sessionsRes.json();
      const mData = await meRes.json();

      if (sData.sessions) {
        setSessions(sData.sessions);
        setCurrentSessionId(sData.currentSessionId);
      }

      if (mData.user) {
        setAccounts(mData.user.accounts || []);
        setHasPassword(mData.user.hasPassword);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?next=/security");
      return;
    }
    if (user) {
      loadSecurityData();
    }
  }, [user, loading, router]);

  const handleRevokeSession = async (sessionId: string) => {
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to revoke session.");
      } else {
        setActionSuccess("Session revoked successfully.");
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (err) {
      setActionError("Network error revoking session.");
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("Are you sure you want to sign out of all active sessions on all devices?")) return;

    try {
      await fetch("/api/v1/auth/logout-all", { method: "POST" });
      router.push("/login");
    } catch (err) {
      setActionError("Failed to logout all sessions.");
    }
  };

  const handleUnlink = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;

    try {
      const res = await fetch(`/api/v1/oauth/unlink/${provider}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to unlink provider.");
      } else {
        setActionSuccess(`${provider} disconnected successfully.`);
        loadSecurityData();
      }
    } catch (err) {
      setActionError("Network error.");
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Security & Active Sessions</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your login credentials, active device sessions, and connected OAuth identities
        </p>
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

      {/* Active Sessions List */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              Active Sessions ({sessions.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Devices and browsers currently authenticated to your Avyantrix ID
            </p>
          </div>

          <button
            onClick={handleLogoutAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out Everywhere
          </button>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sessions.map((s) => {
            const isCurrent = s.id === currentSessionId;
            return (
              <div key={s.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {s.userAgent?.includes("Mobile") ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Laptop className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                        {s.deviceInfo || "Web Browser"}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      IP: {s.ipAddress || "Unknown"} &bull; Last active: {formatDateTime(s.lastActiveAt)}
                    </p>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-1">
          Linked Authentication Providers
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Connect OAuth providers for one-click authentication across Avyantrix
        </p>

        <div className="space-y-3">
          {/* Google */}
          {accounts.some((a) => a.provider === "google") ? (
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  G
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">Google</span>
                  <p className="text-[11px] text-zinc-500">
                    Linked: {accounts.find((a) => a.provider === "google")?.providerEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnlink("google")}
                className="text-xs font-medium text-zinc-600 hover:text-red-600 dark:text-zinc-400"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <a
              href="/api/v1/oauth/google"
              className="flex items-center justify-between p-3.5 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600 text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Link Google Account
              </div>
              <span>Connect &rarr;</span>
            </a>
          )}

          {/* GitHub */}
          {accounts.some((a) => a.provider === "github") ? (
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  GH
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">GitHub</span>
                  <p className="text-[11px] text-zinc-500">
                    Linked: {accounts.find((a) => a.provider === "github")?.providerEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnlink("github")}
                className="text-xs font-medium text-zinc-600 hover:text-red-600 dark:text-zinc-400"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <a
              href="/api/v1/oauth/github"
              className="flex items-center justify-between p-3.5 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600 text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Link GitHub Account
              </div>
              <span>Connect &rarr;</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
