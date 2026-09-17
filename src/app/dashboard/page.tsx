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
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type ActiveRoleView = "BUILDER" | "MENTOR" | "PROBLEM_OWNER" | "CHALLENGE_ORGANIZER";

function DashboardContent() {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profileData, setProfileData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Active Role Cockpit view (defaults to query param if valid, or first held non-admin role, or BUILDER)
  const initialRole = (searchParams.get("role") as ActiveRoleView) || "BUILDER";
  const [activeRoleView, setActiveRoleView] = useState<ActiveRoleView>(initialRole);

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

  const isVerifiedForCurrentView = hasRole(activeRoleView);

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
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                      role === "ADMIN"
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : role === "MENTOR"
                        ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : role === "PROBLEM_OWNER"
                        ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : role === "CHALLENGE_ORGANIZER"
                        ? "border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <Shield className="h-3 w-3" />
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
                {hasRole("BUILDER") && <CheckCircle2 className="h-3 w-3 text-green-600" />}
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
                {hasRole("MENTOR") ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
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
                {hasRole("PROBLEM_OWNER") ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
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
                {hasRole("CHALLENGE_ORGANIZER") ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <Lock className="h-3 w-3 text-zinc-400" />
                )}
              </div>
              <div className="text-[10px] text-zinc-500">Hackathons & Sprints</div>
            </div>
          </button>
        </div>
      </div>

      {/* If role is not verified, render Unlocked Banner CTA */}
      {!isVerifiedForCurrentView && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 p-6 dark:border-zinc-700 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" />
              {activeRoleView === "MENTOR"
                ? "Unlock the Avyantrix Mentor Hub"
                : activeRoleView === "PROBLEM_OWNER"
                ? "Unlock the Enterprise Problem Owner Portal"
                : "Unlock the Challenge Organizer Desk"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-2xl">
              {activeRoleView === "MENTOR"
                ? "Submit your research, advisory, or industry credentials. Once verified by Super-Admins, you can review solutions, advise builder teams, and host technical office hours."
                : activeRoleView === "PROBLEM_OWNER"
                ? "Verify your corporate or institutional entity to publish industrial bottlenecks, fund bounties, and receive verified builder prototype submissions."
                : "Verify your tech club or community track record to host verified hackathons and competitive sprints with Avyantrix scoring rubrics."}
            </p>
          </div>
          <Link
            href={`/verification?track=${activeRoleView === "BUILDER" ? "CAPABILITY_BUILDER" : activeRoleView}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shrink-0"
          >
            Complete {activeRoleView.replace("_", " ")} Verification <ArrowRight className="h-3.5 w-3.5" />
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
                    Mentor Advisory Queue & Code Reviews
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Technical solutions and architecture plans submitted by builders for your review
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                      TinyML Spirometry Firmware Architecture Review
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Submitted by @alex_embedded &bull; Target: Avyantrix Medical Sprint
                    </span>
                  </div>
                  <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                    Open Review
                  </button>
                </div>

                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                      FPGA Memory Controller Timing Closure
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Submitted by @sarah_systems &bull; Target: Venture Prototype
                    </span>
                  </div>
                  <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                    Open Review
                  </button>
                </div>
              </div>
            </div>

            {/* Office Hours & Advisory Domains */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Advisory Office Hours & Availability
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Configure 1-on-1 sprint review slots for verified builder teams
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50/50 p-4 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-300">Weekly Review Slot</div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">Thursdays &bull; 4:00 PM - 6:00 PM UTC</div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">2/4 Builder Slots Reserved</div>
                </div>

                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-center">
                  <div>
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Connect Google Calendar / Cal.com</div>
                    <button className="mt-2 inline-flex items-center gap-1 rounded bg-zinc-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950">
                      Sync Calendar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mentor Credentials</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span className="font-semibold text-green-600">Active Mentor</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Solutions Reviewed</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">14 Prototypes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rating</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">4.9 / 5.0</span>
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

                <button className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Post New Problem
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      Differential Pressure Sensor Calibration Drift at Sub-Zero Ambient
                    </span>
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                      Live &bull; 8 Solutions Inbound
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Industrial MEMS sensor array calibration algorithm requiring low MCU power footprint under 5mA.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800/60">
                    <span className="font-semibold text-amber-600">$5,000 Bounty Allocated</span>
                    <button className="text-xs text-red-600 hover:underline">Review Inbound Proposals &rarr;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Enterprise Metrics</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Active Briefs</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">1 Problem</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Inbound IP</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">8 Prototypes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Escrowed Bounty</span>
                  <span className="font-semibold text-amber-600">$5,000 USD</span>
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
                    Manage hackathon registrations, participant tracking, and judging panels
                  </p>
                </div>

                <button className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Create Sprint
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      Avyantrix DeepTech Hardware Sprint 2026
                    </span>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      Registration Open
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    48-hour competitive sprint focused on physiological sensing, TinyML, and edge computing.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800/60">
                    <span>142 Registered Builders &bull; 12 Teams Formed</span>
                    <button className="text-xs text-purple-600 font-semibold hover:underline">Manage Sprint & Scoring &rarr;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Organizer Overview</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Hosted Sprints</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">1 Live</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Participants</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">142 Builders</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Judging Status</span>
                  <span className="font-semibold text-green-600">Rubric Configured</span>
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
