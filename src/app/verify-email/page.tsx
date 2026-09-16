"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const res = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
        } else {
          setError(data.error || "Verification failed. The link may be expired.");
        }
      } catch (err) {
        setError("Network error verifying token.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <div className="py-8">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-red-500" />
            <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Verifying your Avyantrix ID...
            </p>
          </div>
        ) : success ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Email Verified Successfully
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your Avyantrix account is now fully active. You can sign in and begin exploring Builds and Challenges.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 py-2.5 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all"
              >
                Sign In to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : error ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Verification Failed
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-950 py-2.5 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white">
              <CheckCircle2 className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Verify Your Email
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Please click the link sent to your registered email address to verify your Avyantrix ID.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 py-2.5 px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Return to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
