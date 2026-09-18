"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  User,
  AtSign,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Code2,
  GraduationCap,
  Building2,
  Trophy,
} from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    intendedRole: "BUILDER",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please check your information.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/80 bg-white/90 p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Verify your Avyantrix ID
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              We sent a verification link to <strong className="text-zinc-900 dark:text-white">{formData.email}</strong>. Check your inbox to activate your account.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 py-2.5 px-4 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shadow-xs"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black p-1 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <img
              src="/brand/avyantrix-logo.png"
              alt="Avyantrix"
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="mt-3.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Create your Avyantrix ID
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            One account for Builds, Challenges, and all Avyantrix platforms
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        {(() => {
          const nextTarget = searchParams.get("next") || searchParams.get("return_to") || "";
          const googleOAuthUrl = nextTarget
            ? `/api/v1/oauth/google?return_to=${encodeURIComponent(nextTarget)}`
            : "/api/v1/oauth/google";
          const githubOAuthUrl = nextTarget
            ? `/api/v1/oauth/github?return_to=${encodeURIComponent(nextTarget)}`
            : "/api/v1/oauth/github";

          return (
            <div className="grid grid-cols-2 gap-3">
              <a
                href={googleOAuthUrl}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                Google
              </a>

              <a
                href={githubOAuthUrl}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          );
        })()}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900">Or register with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primary Role / Persona Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Primary Role / Intended Usage
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, intendedRole: "BUILDER" })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                  formData.intendedRole === "BUILDER"
                    ? "border-red-500 bg-red-50/60 text-red-700 dark:border-red-500/80 dark:bg-red-950/40 dark:text-red-300 shadow-2xs font-medium"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
                }`}
              >
                <Code2 className="h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <div className="text-xs font-bold leading-none">Builder</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Code & build</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, intendedRole: "MENTOR" })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                  formData.intendedRole === "MENTOR"
                    ? "border-blue-500 bg-blue-50/60 text-blue-700 dark:border-blue-500/80 dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs font-medium"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
                }`}
              >
                <GraduationCap className="h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <div className="text-xs font-bold leading-none">Mentor</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Guide & review</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, intendedRole: "PROBLEM_OWNER" })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                  formData.intendedRole === "PROBLEM_OWNER"
                    ? "border-amber-500 bg-amber-50/60 text-amber-700 dark:border-amber-500/80 dark:bg-amber-950/40 dark:text-amber-300 shadow-2xs font-medium"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <div className="text-xs font-bold leading-none">Problem Owner</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Post challenges</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, intendedRole: "CHALLENGE_ORGANIZER" })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                  formData.intendedRole === "CHALLENGE_ORGANIZER"
                    ? "border-purple-500 bg-purple-50/60 text-purple-700 dark:border-purple-500/80 dark:bg-purple-950/40 dark:text-purple-300 shadow-2xs font-medium"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
                }`}
              >
                <Trophy className="h-4 w-4 shrink-0 text-purple-500" />
                <div>
                  <div className="text-xs font-bold leading-none">Organizer</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Host hackathons</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                First Name
              </label>
              <div className="relative mt-1">
                <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ada"
                  className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Last Name
              </label>
              <input
                type="text"
                required
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Lovelace"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Username
            </label>
            <div className="relative mt-1">
              <AtSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                required
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="adalovelace"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Handle: auth.avyantrix.com/u/{formData.username || "username"}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ada@avyantrix.com"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Password (Argon2id Encrypted)
            </label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 12 characters"
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
                <Loader2 className="h-4 w-4 animate-spin" /> Creating ID...
              </>
            ) : (
              <>
                Create Avyantrix ID <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have an Avyantrix ID?{" "}
          <Link href="/login" className="font-semibold text-red-600 hover:underline dark:text-red-400">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[85vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
