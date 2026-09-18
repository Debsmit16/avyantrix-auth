"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Code2,
  GraduationCap,
  Building2,
  Trophy,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Briefcase,
  Users,
  Lock,
  ArrowUpRight,
  Inbox,
  FileCheck2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type ActiveRoleView = "BUILDER" | "MENTOR" | "PROBLEM_OWNER" | "CHALLENGE_ORGANIZER";

function DashboardContent() {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profileData, setProfileData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Active Role Cockpit view (defaults to query param if valid, or dynamically determined from user roles)
  const roleParam = searchParams.get("role") as ActiveRoleView | null;
  const [activeRoleView, setActiveRoleView] = useState<ActiveRoleView>(roleParam || "BUILDER");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?next=/dashboard");
      return;
    }

    if (user) {
      // If no query param was specified, automatically activate user's primary persona cockpit
      if (!roleParam) {
        if (user.roles.includes("CHALLENGE_ORGANIZER")) {
          setActiveRoleView("CHALLENGE_ORGANIZER");
        } else if (user.roles.includes("PROBLEM_OWNER")) {
          setActiveRoleView("PROBLEM_OWNER");
        } else if (user.roles.includes("MENTOR")) {
          setActiveRoleView("MENTOR");
        } else {
          setActiveRoleView("BUILDER");
        }
      }

      fetch("/api/v1/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setProfileData(data.user);
        })
        .finally(() => setFetching(false));
    }
  }, [user, loading, router, roleParam]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) return null;

  // Get matching active badge for current role view if any
  const currentRoleBadge = profileData?.badges?.find((b: any) => {
    if (activeRoleView === "BUILDER") return b.category === "CAPABILITY_BUILDER";
    return b.category === activeRoleView;
  });

  // User is verified for current view ONLY if they have an active badge or are Super-Admin
  const isVerifiedForCurrentView = hasRole("ADMIN") || Boolean(currentRoleBadge?.isActive);
  const isRoleAssigned = hasRole(activeRoleView);

  // Status helpers for all 4 role tabs
  const hasBuilderBadge = profileData?.badges?.some((b: any) => b.category === "CAPABILITY_BUILDER" && b.isActive);
  const hasMentorBadge = profileData?.badges?.some((b: any) => b.category === "MENTOR" && b.isActive);
  const hasProblemOwnerBadge = profileData?.badges?.some((b: any) => b.category === "PROBLEM_OWNER" && b.isActive);
  const hasOrganizerBadge = profileData?.badges?.some((b: any) => b.category === "CHALLENGE_ORGANIZER" && b.isActive);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-950 text-xl font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {user.firstName[0]}
                {user.lastName[0] || ""}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <span className="text-xs text-zinc-500 font-mono">(@{user.username})</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                {profileData?.profile?.headline || "Avyantrix ID Ecosystem Member"}
              </p>
              
              {/* Active Badges / Roles Bar */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {user.roles.map((role) => {
                  const isRoleVerified = role === "ADMIN" || profileData?.badges?.some((b: any) => {
                    if (role === "BUILDER") return b.category === "CAPABILITY_BUILDER" && b.isActive;
                    return b.category === role && b.isActive;
                  });

                  return (
                    <span
                      key={role}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        role === "ADMIN"
                          ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                          : isRoleVerified
                          ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                          : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {isRoleVerified ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="h-3 w-3 text-amber-500" />
                      )}
                      {role} {isRoleVerified ? "(Verified)" : "(Unverified)"}
                    </span>
                  );
                })}

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

      {/* Enterprise Role Cockpit Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Enterprise Role Cockpits
          </h2>
          <span className="text-[11px] text-zinc-500">
            Switch active workspace context with 1-click
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Builder Tab */}
          <button
            onClick={() => setActiveRoleView("BUILDER")}
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left transition-all ${
              activeRoleView === "BUILDER"
                ? "border-red-500 bg-red-50/50 dark:border-red-500/80 dark:bg-red-950/30 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 shrink-0">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                Builder Cockpit
                {hasBuilderBadge ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : hasRole("BUILDER") ? (
                  <span className="inline-flex items-center text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                    Pending
                  </span>
                ) : (
                  <Lock className="h-3 w-3 text-zinc-400" />
                )}
              </div>
              <div className="text-[10px] text-zinc-500">Projects & Proofs</div>
            </div>
          </button>

          {/* Mentor Tab */}
          <button
            onClick={() => setActiveRoleView("MENTOR")}
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left transition-all ${
              activeRoleView === "MENTOR"
                ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/80 dark:bg-blue-950/30 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                Mentor Hub
                {hasMentorBadge ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : hasRole("MENTOR") ? (
                  <span className="inline-flex items-center text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                    Pending
                  </span>
                ) : (
                  <Lock className="h-3 w-3 text-zinc-400" />
                )}
              </div>
              <div className="text-[10px] text-zinc-500">Advisory & Reviews</div>
            </div>
          </button>

          {/* Problem Owner Tab */}
          <button
            onClick={() => setActiveRoleView("PROBLEM_OWNER")}
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left transition-all ${
              activeRoleView === "PROBLEM_OWNER"
                ? "border-amber-500 bg-amber-50/50 dark:border-amber-500/80 dark:bg-amber-950/30 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                Problem Owner
                {hasProblemOwnerBadge ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : hasRole("PROBLEM_OWNER") ? (
                  <span className="inline-flex items-center text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                    Pending
                  </span>
                ) : (
                  <Lock className="h-3 w-3 text-zinc-400" />
                )}
              </div>
              <div className="text-[10px] text-zinc-500">Briefs & Bounties</div>
            </div>
          </button>

          {/* Challenge Organizer Tab */}
          <button
            onClick={() => setActiveRoleView("CHALLENGE_ORGANIZER")}
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left transition-all ${
              activeRoleView === "CHALLENGE_ORGANIZER"
                ? "border-purple-500 bg-purple-50/50 dark:border-purple-500/80 dark:bg-purple-950/30 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                Organizer Desk
                {hasOrganizerBadge ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : hasRole("CHALLENGE_ORGANIZER") ? (
                  <span className="inline-flex items-center text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                    Pending
                  </span>
                ) : (
                  <Lock className="h-3 w-3 text-zinc-400" />
                )}
              </div>
              <div className="text-[10px] text-zinc-500">Hackathons & Sprints</div>
            </div>
          </button>
        </div>
      </div>

      {/* If role is not verified, render Unverified / Unlock Banner CTA */}
      {!isVerifiedForCurrentView && (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-6 dark:border-amber-800/60 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              {isRoleAssigned
                ? `${activeRoleView.replace("_", " ")} Status: Unverified (Pending Approval)`
                : `Unlock ${activeRoleView.replace("_", " ")} Workspace`}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl">
              {isRoleAssigned
                ? `You have registered as a ${activeRoleView.replace("_", " ")}, but your verification credentials and proof are currently unverified. Submit full details for Super-Admin review to unlock all platform permissions and earn your verified badge.`
                : `Submit an application to apply for ${activeRoleView.replace("_", " ")} verification credentials.`}
            </p>
          </div>
          <Link
            href={`/verification?track=${activeRoleView === "BUILDER" ? "CAPABILITY_BUILDER" : activeRoleView}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shrink-0"
          >
            {isRoleAssigned ? "Submit / Update Verification Details" : `Apply for ${activeRoleView.replace("_", " ")} Track`}{" "}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COCKPIT 1: BUILDER WORKSPACE */}
      {/* ========================================================================= */}
      {activeRoleView === "BUILDER" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Connected Ecosystems */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-red-500" />
                Connected Avyantrix Platforms
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Your Avyantrix ID grants seamless single sign-on across the builder ecosystem
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Builds Gateway */}
                <a
                  href="https://builds.avyantrix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Venture Platform
                    </span>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                      Active
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-1 group-hover:text-red-500 transition-colors">
                    Avyantrix Builds
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Collaborative venture engineering, hardware prototypes, and systems development.
                  </p>
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>Launch Builds</span>
                    <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </a>

                {/* Challenges Gateway */}
                <a
                  href="https://challenges.avyantrix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Hackathons & Sprints
                    </span>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                      Active
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-1 group-hover:text-red-500 transition-colors">
                    Avyantrix Challenges
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Solve real-world industrial and clinical problems in deep-tech competitive sprints.
                  </p>
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>Explore Challenges</span>
                    <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </a>
              </div>
            </div>

            {/* Verified Capabilities & Badges */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-red-500" />
                  Verified Badges & Capability Matrix
                </h2>
                <Link
                  href="/verification?track=CAPABILITY_BUILDER"
                  className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                >
                  Submit Capability Proof &rarr;
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
                    href="/verification?track=CAPABILITY_BUILDER"
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
                Security & Identity
              </h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Password Encryption</span>
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
      )}

      {/* ========================================================================= */}
      {/* COCKPIT 2: MENTOR WORKSPACE */}
      {/* ========================================================================= */}
      {activeRoleView === "MENTOR" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Mentee & Review Queues */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                    Mentor Solution Review Desk
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Technical prototype reviews and advisory requests assigned to you
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-zinc-400" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-2">
                  No Pending Reviews
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  When builder teams submit code repositories or hardware prototypes for mentor evaluation, they will appear here.
                </p>
                <a
                  href="https://builds.avyantrix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Explore Active Venture Builds <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Office Hours & Advisory Channels */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Office Hours & Advisory Settings
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Configure your weekly advisory channel and connect external calendar booking
              </p>

              <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">External Calendar Sync</div>
                  <div className="text-[11px] text-zinc-500">Connect Google Calendar or Cal.com link on your public profile</div>
                </div>
                <Link
                  href="/profile"
                  className="rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 transition-colors shrink-0"
                >
                  Update Profile Links
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mentor Status</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Role Status</span>
                  {isVerifiedForCurrentView ? (
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active (Verified Mentor)
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Unverified (Pending Review)
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Verified Badge</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {currentRoleBadge?.badgeLabel || "None (Awaiting Approval)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Permissions</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400 text-[10px]">
                    {isVerifiedForCurrentView ? "mentor.access, review" : "restricted.pending_verification"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COCKPIT 3: PROBLEM OWNER WORKSPACE */}
      {/* ========================================================================= */}
      {activeRoleView === "PROBLEM_OWNER" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Problem Statements Manager */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-amber-500" />
                    Published Problem Statements & Briefs
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Real-world industrial problems published to verified Avyantrix builders
                  </p>
                </div>

                <a
                  href="https://builds.avyantrix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Post Problem Statement
                </a>
              </div>

              <div className="mt-6 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <FileCheck2 className="mx-auto h-8 w-8 text-zinc-400" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-2">
                  No Active Problem Statements Published
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  When you publish industrial bottlenecks, hardware constraints, or venture challenge briefs, they will appear here.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Enterprise Status</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Entity Status</span>
                  {isVerifiedForCurrentView ? (
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified Partner
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Unverified (Pending Review)
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Verified Badge</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {currentRoleBadge?.badgeLabel || "None (Awaiting Approval)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Permissions</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400 text-[10px]">
                    {isVerifiedForCurrentView ? "problem.create" : "restricted.pending_verification"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COCKPIT 4: CHALLENGE ORGANIZER WORKSPACE */}
      {/* ========================================================================= */}
      {activeRoleView === "CHALLENGE_ORGANIZER" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-500" />
                    Competitive Hackathons & Sprints
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manage hackathon registrations, participant tracking, and judging rubrics
                  </p>
                </div>

                <a
                  href="https://challenges.avyantrix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Create New Sprint
                </a>
              </div>

              <div className="mt-6 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <Trophy className="mx-auto h-8 w-8 text-zinc-400" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-2">
                  No Hosted Sprints Yet
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  When you host or co-organize competitive sprints on Avyantrix Challenges, your participants, team formations, and live leaderboards will appear here.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Organizer Status</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Organizer Status</span>
                  {isVerifiedForCurrentView ? (
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified Host
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Unverified (Pending Review)
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Verified Badge</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {currentRoleBadge?.badgeLabel || "None (Awaiting Approval)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Permissions</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400 text-[10px]">
                    {isVerifiedForCurrentView ? "challenge.create" : "restricted.pending_verification"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
