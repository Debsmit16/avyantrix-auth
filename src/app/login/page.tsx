"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Loader2, KeyRound, ArrowLeft, Sparkles, Check } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);

  // Auth Method: password vs magic-link
  const [authMethod, setAuthMethod] = useState<"password" | "magic">("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // 2FA Challenge State
  const [twoFactorMode, setTwoFactorMode] = useState(false);
  const [twoFactorTempToken, setTwoFactorTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isBackupCodeMode, setIsBackupCodeMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Check if 2FA challenge is required
      if (data.requires2FA && data.tempToken) {
        setTwoFactorTempToken(data.tempToken);
        setTwoFactorMode(true);
        setLoading(false);
        return;
      }

      await refreshSession();
      const nextUrl = searchParams.get("next") || "/dashboard";
      router.push(nextUrl);
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/magic-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send magic link.");
        setLoading(false);
        return;
      }

      setMagicLinkSent(true);
      setLoading(false);
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: twoFactorTempToken,
          code: twoFactorCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid 2FA code.");
        setLoading(false);
        return;
      }

      await refreshSession();
      const nextUrl = searchParams.get("next") || "/dashboard";
      router.push(nextUrl);
    } catch (err) {
      setError("Network error validating 2FA.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-md">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black p-1 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <img
              src="/brand/avyantrix-logo.png"
              alt="Avyantrix"
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="mt-3.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Sign in to Avyantrix ID
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            One account for Builds, Challenges, and all Avyantrix platforms
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 2FA Challenge Form */}
        {twoFactorMode ? (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="rounded-xl border border-red-500/20 bg-red-50/40 p-4 dark:border-red-900/30 dark:bg-red-950/20 text-center space-y-1">
              <KeyRound className="h-6 w-6 text-red-500 mx-auto" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                {isBackupCodeMode ? "Enter Backup Recovery Code" : "Authenticator Code Required"}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isBackupCodeMode
                  ? "Enter one of your 10-character emergency backup recovery codes (e.g. A1B2C-D3E4F)."
                  : "Enter the 6-digit verification code generated by your authenticator app."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {isBackupCodeMode ? "Backup Recovery Code" : "6-Digit Authenticator Code"}
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={isBackupCodeMode ? 12 : 6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase())}
                placeholder={isBackupCodeMode ? "XXXXX-XXXXX" : "000000"}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3 text-center text-lg font-mono tracking-widest text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-2.5 px-4 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Verify & Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsBackupCodeMode(!isBackupCodeMode);
                  setTwoFactorCode("");
                }}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 font-medium"
              >
                {isBackupCodeMode ? "← Use Authenticator App" : "Use backup recovery code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorMode(false);
                  setTwoFactorTempToken("");
                  setTwoFactorCode("");
                }}
                className="text-red-600 hover:underline dark:text-red-400"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/api/v1/oauth/google"
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                Google
              </a>

              <a
                href="/api/v1/oauth/github"
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900">Or continue with email</span>
              </div>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("password");
                  setMagicLinkSent(false);
                  setError("");
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  authMethod === "password"
                    ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("magic");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMethod === "magic"
                    ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}
              >
                <Sparkles className="h-3 w-3 text-red-500" /> Magic Link
              </button>
            </div>

            {authMethod === "password" ? (
              /* Email / Password Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Email Address
                  </label>
                  <div className="relative mt-1">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@avyantrix.com"
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-red-600 hover:text-red-500 dark:text-red-400"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative mt-1">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-2.5 px-4 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                    </>
                  ) : (
                    <>
                      Sign In to Avyantrix <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Passwordless Magic Link Form */
              <div className="space-y-4">
                {magicLinkSent ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-4 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20 space-y-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                      Check your email inbox
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      If an account matches <strong>{email}</strong>, we sent a one-click login link. The link expires in 15 minutes.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMagicLinkSent(false)}
                      className="text-xs text-red-600 hover:underline dark:text-red-400 font-medium pt-1 inline-block"
                    >
                      Send to a different email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Email Address
                      </label>
                      <div className="relative mt-1">
                        <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="developer@avyantrix.com"
                          className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        We&apos;ll send a passwordless one-click authentication link to this address.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-2.5 px-4 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shadow-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending Link...
                        </>
                      ) : (
                        <>
                          Send Magic Link <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Footer Link */}
            <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              Don&apos;t have an Avyantrix ID?{" "}
              <Link href="/register" className="font-semibold text-red-600 hover:underline dark:text-red-400">
                Create account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
