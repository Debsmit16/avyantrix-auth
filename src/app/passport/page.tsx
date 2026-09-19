"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  Copy,
  ExternalLink,
  GraduationCap,
  MapPin,
  Github,
  Linkedin,
  Globe,
  Sparkles,
  Award,
  Zap,
  RefreshCw,
  QrCode,
  ArrowRight,
  Code2,
  Terminal,
} from "lucide-react";
import { getAvatarDataUrl } from "@/lib/avatar";

interface PassportData {
  passport_id: string;
  passport_version: string;
  issued_at: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    email_verified: boolean;
    avatar_url: string | null;
    headline: string | null;
    bio: string | null;
    location: string | null;
    member_since: string;
  };
  education: {
    institution: string | null;
    graduation_year: number | null;
    current_status: string;
    is_verified: boolean;
  };
  developer_links: {
    github: string | null;
    linkedin: string | null;
    portfolio: string | null;
    connected_providers: string[];
  };
  skills: Array<{
    name: string;
    category: string;
    proficiency: string;
    is_verified: boolean;
  }>;
  clearances: {
    roles: string[];
    is_builder_verified: boolean;
    is_education_verified: boolean;
    is_challenge_organizer: boolean;
    is_problem_owner: boolean;
    active_badges: Array<{
      category: string;
      badgeLabel: string;
      issuedAt: string;
    }>;
  };
  ecosystem_pass: {
    challenges_fast_pass: boolean;
    builds_bounty_eligible: boolean;
    one_click_apply_supported: boolean;
  };
}

export default function PassportPage() {
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  useEffect(() => {
    async function loadPassport() {
      try {
        const res = await fetch("/api/v1/oauth/passport");
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login?redirect=/passport";
            return;
          }
          throw new Error("Failed to load passport data");
        }
        const data = await res.json();
        setPassport(data);
      } catch (err) {
        setError((err as Error).message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadPassport();
  }, []);

  const copyPassportJson = () => {
    if (!passport) return;
    navigator.clipboard.writeText(JSON.stringify(passport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent mb-4" />
        <p className="text-sm text-zinc-500 font-mono">Generating Avyantrix Fast Hackathon Passport...</p>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
          <Shield className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Passport Error</h2>
          <p className="text-xs text-zinc-500 mt-1">{error || "Could not retrieve your passport."}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 mb-2">
            <Zap className="h-3.5 w-3.5" />
            <span>Devfolio Alternative • 1-Click Fast Pass</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Avyantrix Hackathon Passport
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Universal credential passport powering 1-click applications across <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Challenges</strong> and collegiate hackathons.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={copyPassportJson}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-2xs transition-colors"
          >
            <Copy className="h-3.5 w-3.5 text-zinc-500" />
            {copied ? "Passport JSON Copied!" : "Export Passport JSON"}
          </button>
          <a
            href="https://challenges.avyantrix.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-xs shadow-red-500/20 transition-all"
          >
            <span>Avyantrix Challenges</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Holographic Passport Card */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50 to-red-50/30 p-6 sm:p-8 shadow-xl dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/20 backdrop-blur-xl">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/10 blur-3xl dark:bg-red-600/10" />

        {/* Passport Header Strip */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 shadow-md shadow-red-500/30 text-white font-black text-sm">
              AX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-zinc-900 dark:text-white">
                  AVYANTRIX DIGITAL PASSPORT
                </span>
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-500">
                PASSPORT NO: {passport.passport_id}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right font-mono text-[11px] text-zinc-400">
            <span>SPEC: RFC-OIDC-HACK</span>
            <span>ISSUED: {new Date(passport.issued_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Identity & Credentials Body */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Column 1: Identity Card & Photo */}
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={
                  passport.user.avatar_url ||
                  getAvatarDataUrl(passport.user.full_name, passport.user.username, 200)
                }
                alt={passport.user.full_name}
                className="h-32 w-32 rounded-2xl object-cover border-4 border-white shadow-md dark:border-zinc-800"
              />
              <div className="absolute -bottom-2 -right-2 rounded-xl bg-red-600 p-1.5 text-white shadow-sm">
                <Shield className="h-4 w-4" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {passport.user.full_name}
              </h2>
              <p className="text-xs font-mono font-medium text-red-600 dark:text-red-400">
                @{passport.user.username}
              </p>
              {passport.user.headline && (
                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-1">
                  {passport.user.headline}
                </p>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              {passport.user.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{passport.user.location}</span>
                </div>
              )}
              {passport.education.institution && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
                  <span>
                    {passport.education.institution}{" "}
                    {passport.education.graduation_year ? `('${String(passport.education.graduation_year).slice(-2)})` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Verified Badges, Skills & Links */}
          <div className="md:col-span-2 space-y-6">
            {/* Clearances & Status Badges */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-red-500" />
                Verified Ecosystem Clearances
              </h3>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>1-Click Hackathon Fast Pass</span>
                </div>

                {passport.clearances.is_builder_verified && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-50/60 px-3 py-1.5 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
                    <span>Verified Avyantrix Builder</span>
                  </div>
                )}

                {passport.clearances.is_challenge_organizer && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-50/60 px-3 py-1.5 text-xs font-bold text-purple-700 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                    <span>Hackathon Organizer Clearance</span>
                  </div>
                )}

                {passport.clearances.active_badges.map((b, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>{b.badgeLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Radar */}
            {passport.skills && passport.skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-red-500" />
                  Engineering Domains & Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {passport.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border border-zinc-200 bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {s.name}
                      <span className="ml-1 text-[10px] text-zinc-400 font-mono">
                        ({s.proficiency.toLowerCase()})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Verified Profiles
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {passport.developer_links.github && (
                  <a
                    href={passport.developer_links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {passport.developer_links.linkedin && (
                  <a
                    href={passport.developer_links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Linkedin className="h-3.5 w-3.5 text-blue-600" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {passport.developer_links.portfolio && (
                  <a
                    href={passport.developer_links.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Passport Footer Information */}
        <div className="mt-8 border-t border-zinc-200/80 pt-4 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-zinc-400">
              HASH: SHA256:{passport.user.id.replace(/-/g, "").substring(0, 16)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-xs font-semibold text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400"
            >
              Edit Profile Info
            </Link>
            <Link
              href="/verification"
              className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Get More Clearances →
            </Link>
          </div>
        </div>
      </div>

      {/* Developer API & Hackathon Integration Box */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Developers & Hackathon Organizers API
              </h3>
              <p className="text-xs text-zinc-500">
                Fetch this applicant payload via OAuth 2.0 / OIDC Bearer tokens on Avyantrix Challenges.
              </p>
            </div>
          </div>
          <Link
            href="/developers"
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Integration Docs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-950 p-3.5 font-mono text-xs text-zinc-300 overflow-x-auto">
          <code>
            GET /api/v1/oauth/passport <span className="text-zinc-500"># Authorization: Bearer &#123;access_token&#125;</span>
          </code>
        </div>
      </div>
    </div>
  );
}
