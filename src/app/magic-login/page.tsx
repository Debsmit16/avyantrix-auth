"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Sparkles, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";

function MagicLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">(token ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "No verification token provided. Please use the link sent to your email."
  );

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch(`/api/v1/auth/magic-login?token=${encodeURIComponent(token!)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus("success");
          setTimeout(() => {
            router.push(data.redirect || "/dashboard");
          }, 1500);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Magic link verification failed.");
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage("Network error during verification. Please try again.");
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/90 backdrop-blur-md text-center">
        {status === "verifying" && (
          <div className="space-y-4 py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Authenticating Magic Link
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Validating your one-time cryptographic token and establishing your secure session...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Authentication Successful!
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your identity has been verified. Redirecting you to your Avyantrix workspace...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5 py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                Magic Link Expired or Invalid
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {errorMessage}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
              >
                Request a New Login Link <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      }
    >
      <MagicLoginContent />
    </Suspense>
  );
}
