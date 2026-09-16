"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  User,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Layers,
  Code,
  Award,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?next=/dashboard");
      return;
    }

    if (user) {
      fetch("/api/v1/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setProfileData(data.user);
        })
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {profileData?.profile?.avatarUrl ? (
              <img
                src={profileData.profile.avatarUrl}
                alt={user.firstName}
                className="h-16 w-16 rounded-full border-2 border-red-500 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {user.firstName[0]}
                {user.lastName[0] || ""}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <span className="text-xs text-zinc-500">(@{user.username})</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                {profileData?.profile?.headline || "Avyantrix Builder"}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <Shield className="h-3 w-3 text-red-500" />
                    {role}
                  </span>
                ))}
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" /> Unverified Email
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/u/${user.username}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Public Profile <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/profile"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Platforms & Verified Badges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Platforms */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-red-500" />
              Connected Avyantrix Platforms
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Your Avyantrix ID automatically signs you in to these ecosystems
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Builds Gateway */}
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Venture Platform
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    Active
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-1">Avyantrix Builds</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Collaborative venture engineering, hardware prototypes, and systems development.
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Authorized as Builder</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Challenges Gateway */}
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Hackathons & Sprints
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    Active
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-1">Avyantrix Challenges</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Solve real-world industrial and clinical problems in deep-tech competitive sprints.
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Participant Profile Linked</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Verified Capabilities & Skills */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-red-500" />
                Verified Badges & Skills
              </h2>
              <Link
                href="/verification"
                className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
              >
                Submit Evidence &rarr;
              </Link>
            </div>

            {profileData?.badges && profileData.badges.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profileData.badges.map((badge: any) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
                    {badge.badgeLabel}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No verified capability badges issued yet. Submit project repositories or credentials to earn verified builder status.
                </p>
                <Link
                  href="/verification"
                  className="mt-2 inline-block text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                >
                  Request Builder Verification
                </Link>
              </div>
            )}

            {/* Skills Taxonomy */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Claimed Skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profileData?.skills && profileData.skills.length > 0 ? (
                  profileData.skills.map((skill: any) => (
                    <span
                      key={skill.id}
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {skill.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400">No skills added yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Security & Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-red-500" />
              Security Overview
            </h2>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Password</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {profileData?.hasPassword ? "Argon2id Encrypted" : "OAuth Only"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Connected Accounts</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {profileData?.accounts?.length || 0} Provider(s)
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Link
                href="/security"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                Manage Active Sessions & Security
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Avyantrix Identity Rule</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Reputation at Avyantrix is grounded in verified work. Private verification evidence is never published; only earned badges and proof links appear on your public ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
