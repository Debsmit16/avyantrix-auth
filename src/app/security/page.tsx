"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Laptop,
  Smartphone,
  Trash2,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Copy,
  Download,
  Eye,
  EyeOff,
  QrCode,
  Key,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function SecurityPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // 2FA Setup State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpAuthUri: string; qrCodeSvg?: string; qrCodeDataUrl?: string } | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  // Backup Codes State
  const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // 2FA Disable State
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState("");

  // Global action status
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
        setTwoFactorEnabled(Boolean(mData.user.twoFactorEnabled));
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

  // Password update submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword.length < 12) {
      setPwError("New password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Failed to update password.");
      } else {
        setPwSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setHasPassword(true);
      }
    } catch (err) {
      setPwError("Network error updating password.");
    } finally {
      setPwLoading(false);
    }
  };

  // Start 2FA Setup
  const handleStart2faSetup = async () => {
    setSetupError("");
    setSetupLoading(true);
    try {
      const res = await fetch("/api/v1/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to start 2FA setup.");
      } else {
        setSetupData(data);
        setSetupModalOpen(true);
      }
    } catch (err) {
      setActionError("Network error initializing 2FA.");
    } finally {
      setSetupLoading(false);
    }
  };

  // Confirm and Enable 2FA
  const handleConfirm2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || !setupCode) return;

    setSetupError("");
    setSetupLoading(true);

    try {
      const res = await fetch("/api/v1/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: setupData.secret,
          code: setupCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || "Verification failed. Check the 6-digit code.");
      } else {
        setSetupModalOpen(false);
        setSetupCode("");
        setTwoFactorEnabled(true);
        if (data.backupCodes && Array.isArray(data.backupCodes)) {
          setBackupCodes(data.backupCodes);
          setBackupCodesModalOpen(true);
        }
        setActionSuccess("Two-factor authentication has been successfully enabled!");
      }
    } catch (err) {
      setSetupError("Network error enabling 2FA.");
    } finally {
      setSetupLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError("");
    setDisableLoading(true);

    try {
      const res = await fetch("/api/v1/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: disablePassword || undefined,
          code: disableCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDisableError(data.error || "Failed to disable 2FA.");
      } else {
        setDisableModalOpen(false);
        setDisablePassword("");
        setDisableCode("");
        setTwoFactorEnabled(false);
        setActionSuccess("Two-factor authentication has been disabled.");
      }
    } catch (err) {
      setDisableError("Network error disabling 2FA.");
    } finally {
      setDisableLoading(false);
    }
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    const text = `Avyantrix ID - Two-Factor Authentication Backup Codes\nGenerated on: ${new Date().toISOString()}\n\nKeep these codes in a safe place. Each code can be used once if you lose access to your authenticator app:\n\n${backupCodes.join("\n")}\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avyantrix-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          Manage your login credentials, two-factor authentication, active device sessions, and connected OAuth identities.
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

      {/* 2FA Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${twoFactorEnabled ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"}`}>
              {twoFactorEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                  Two-Factor Authentication (2FA)
                </h2>
                {twoFactorEnabled ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1 max-w-xl">
                Add an extra layer of security to your Avyantrix ID. Require a 6-digit verification code from Google Authenticator, Authy, or 1Password when signing in.
              </p>
            </div>
          </div>

          <div>
            {twoFactorEnabled ? (
              <button
                onClick={() => setDisableModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 transition-colors"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={handleStart2faSetup}
                disabled={setupLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Enable 2FA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Password Management */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            {hasPassword ? "Change Password" : "Set Account Password"}
          </h2>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          {hasPassword
            ? "Ensure your account is using a long, random password to stay secure."
            : "Set a secure password to sign in directly with your email without relying solely on OAuth."}
        </p>

        {pwSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Password updated successfully!</span>
          </div>
        )}

        {pwError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          {hasPassword && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:bg-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                >
                  {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              New Password (min. 12 characters)
            </label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={12}
                placeholder="Enter new strong password"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-type new password"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:bg-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={pwLoading || !newPassword || !confirmPassword}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors disabled:opacity-50"
          >
            {pwLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {hasPassword ? "Update Password" : "Set Password"}
          </button>
        </form>
      </div>

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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-300">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-300">
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

      {/* MODAL: 2FA Setup */}
      {setupModalOpen && setupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Set Up Two-Factor Authentication
                </h3>
              </div>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-white">1. Scan the QR Code</p>
                <p>Open Google Authenticator, Authy, or 1Password and scan the QR code below:</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                {setupData.qrCodeDataUrl ? (
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="Two-Factor Authentication QR Code"
                    className="h-48 w-48 rounded-lg bg-white p-2 shadow-sm"
                  />
                ) : (
                  <div
                    className="rounded-lg bg-white p-2 shadow-inner"
                    dangerouslySetInnerHTML={{ __html: setupData.qrCodeSvg || "" }}
                  />
                )}
              </div>

              {/* Manual Entry Key */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-500">
                  Can't scan? Enter this secret key manually:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={setupData.secret}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(setupData.secret)}
                    className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    title="Copy Key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Step 2: Verification Code */}
              <form onSubmit={handleConfirm2fa} className="space-y-3 pt-2">
                <div className="text-xs text-zinc-600 dark:text-zinc-300">
                  <p className="font-semibold text-zinc-900 dark:text-white mb-1">
                    2. Enter 6-digit confirmation code
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="000000"
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))}
                    required
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                {setupError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {setupError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSetupModalOpen(false)}
                    className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={setupLoading || setupCode.length !== 6}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {setupLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Verify & Activate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Backup Recovery Codes */}
      {backupCodesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Save Your Backup Recovery Codes
              </h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Store these single-use recovery codes in a safe place. If you ever lose access to your authenticator device, you can log in using one of these codes.
            </p>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="tracking-wider text-center py-1 bg-white dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={handleCopyBackupCodes}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedCodes ? "Copied!" : "Copy Codes"}
              </button>
              <button
                onClick={handleDownloadBackupCodes}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Download className="h-3.5 w-3.5" />
                Download .txt
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setBackupCodesModalOpen(false)}
                className="w-full rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                I have saved my backup codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Disable 2FA */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Disable Two-Factor Authentication
                </h3>
              </div>
              <button
                onClick={() => setDisableModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Disabling 2FA will lower your account security. Please verify your identity with your password or current 6-digit authenticator code:
            </p>

            <form onSubmit={handleDisable2fa} className="space-y-3">
              {hasPassword ? (
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Account Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Current Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-center font-mono text-sm tracking-widest text-zinc-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              )}

              {disableError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {disableError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableLoading || (!disablePassword && !disableCode)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {disableLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Disable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
