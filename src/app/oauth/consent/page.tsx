"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, CheckCircle2, XCircle, ArrowRight, UserCheck, Lock } from "lucide-react";
import { getAvatarDataUrl } from "@/lib/avatar";

function ConsentContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client_id") || "";
  const appName = searchParams.get("app_name") || "Third-Party Application";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const scope = searchParams.get("scope") || "openid profile email";
  const state = searchParams.get("state") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "";

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  const handleAllow = () => {
    const authorizeUrl = new URL("/api/v1/oauth/authorize", window.location.origin);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", scope);
    authorizeUrl.searchParams.set("consented", "true");
    if (state) authorizeUrl.searchParams.set("state", state);
    if (codeChallenge) authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    if (codeChallengeMethod) authorizeUrl.searchParams.set("code_challenge_method", codeChallengeMethod);

    window.location.href = authorizeUrl.toString();
  };

  const handleDeny = () => {
    try {
      const callback = new URL(redirectUri);
      callback.searchParams.set("error", "access_denied");
      callback.searchParams.set("error_description", "The user denied the authorization request.");
      if (state) callback.searchParams.set("state", state);
      window.location.href = callback.toString();
    } catch {
      router.push("/dashboard");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
            Authorization Request
          </h1>
          <p className="text-xs text-zinc-500">
            <span className="font-semibold text-zinc-900 dark:text-white">{appName}</span> wants to access your Avyantrix ID account.
          </p>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/60">
            <img
              src={user.avatarUrl || getAvatarDataUrl(`${user.firstName} ${user.lastName}`, user.username, 72)}
              alt={user.firstName}
              className="h-9 w-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
            <div className="truncate">
              <span className="text-xs font-semibold text-zinc-900 dark:text-white block truncate">
                {user.firstName} {user.lastName} <span className="font-mono text-zinc-400 font-normal">(@{user.username})</span>
              </span>
              <span className="text-[11px] text-zinc-400 block truncate">{user.email}</span>
            </div>
          </div>
        )}

        {/* Requested Permissions */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            This application will be able to:
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 p-2.5 dark:border-zinc-800">
              <UserCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-white block">
                  Access your profile identity
                </span>
                <span className="text-[11px] text-zinc-500">
                  Read your name, username, headline, and bio.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 p-2.5 dark:border-zinc-800">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-white block">
                  Verify credential badges
                </span>
                <span className="text-[11px] text-zinc-500">
                  Verify your active Builder, Mentor, or Organizer clearances.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 p-2.5 dark:border-zinc-800">
              <Lock className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-white block">
                  View your email address
                </span>
                <span className="text-[11px] text-zinc-500">
                  Link your Avyantrix ID to their service.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleDeny}
            className="w-full rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAllow}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-colors"
          >
            Allow Access <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        </div>
      }
    >
      <ConsentContent />
    </Suspense>
  );
}
