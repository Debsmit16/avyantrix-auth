"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Trophy,
  Zap,
  Globe,
  KeyRound,
  ArrowRight,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<"challenges" | "builds" | "nextauth" | "curl">("challenges");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const challengesSnippet = `// 1. Avyantrix Challenges - 1-Click Fast Hackathon Application
// When a builder applies to a hackathon, fetch their verified passport in 1 line:
export async function fetchApplicantPassport(accessToken: string) {
  const res = await fetch("https://auth.avyantrix.com/api/v1/oauth/passport", {
    headers: { Authorization: \`Bearer \${accessToken}\` },
  });

  const passport = await res.json();

  // Instant pre-population without asking users to type anything:
  return {
    applicantId: passport.user.id,
    fullName: passport.user.full_name,
    email: passport.user.email,
    college: passport.education.institution,
    gradYear: passport.education.graduation_year,
    github: passport.developer_links.github,
    linkedin: passport.developer_links.linkedin,
    skills: passport.skills.map((s) => s.name),
    isFastPassVerified: passport.ecosystem_pass.challenges_fast_pass,
  };
}`;

  const buildsSnippet = `// 2. Avyantrix Builds - Problem Owner & Builder Clearance Verification
// Automatically verify if a user has clearance to claim bounties or post problems:
export async function checkBuildsClearance(bearerToken: string) {
  const res = await fetch("https://auth.avyantrix.com/api/v1/oauth/userinfo", {
    headers: { Authorization: \`Bearer \${bearerToken}\` },
  });

  const userInfo = await res.json();

  const isVerifiedBuilder = userInfo.roles.includes("BUILDER") ||
    userInfo.badges?.some((b: any) => b.category === "CAPABILITY_BUILDER");

  const isProblemOwner = userInfo.roles.includes("PROBLEM_OWNER");

  return {
    userId: userInfo.sub,
    username: userInfo.preferred_username,
    canClaimBounties: isVerifiedBuilder,
    canPostProblems: isProblemOwner,
    verifiedBadges: userInfo.badges,
  };
}`;

  const nextAuthSnippet = `// 3. NextAuth.js / Auth.js - Plug & Play Provider for any Avyantrix App
import NextAuth from "next-auth";

export const authOptions = {
  providers: [
    {
      id: "avyantrix",
      name: "Avyantrix ID",
      type: "oauth",
      wellKnown: "https://auth.avyantrix.com/.well-known/openid-configuration",
      authorization: {
        params: { scope: "openid profile email roles clearances" },
      },
      idToken: true,
      checks: ["pkce", "state"],
      clientId: process.env.AVYANTRIX_CLIENT_ID!,
      clientSecret: process.env.AVYANTRIX_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          roles: profile.roles,
          badges: profile.badges,
        };
      },
    },
  ],
};`;

  const curlSnippet = `# 1. Discovery Endpoint
curl -X GET https://auth.avyantrix.com/.well-known/openid-configuration

# 2. Exchange PKCE Code for Tokens
curl -X POST https://auth.avyantrix.com/api/v1/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=your_client_id" \\
  -d "code=auth_code_here" \\
  -d "redirect_uri=https://challenges.avyantrix.com/api/auth/callback" \\
  -d "code_verifier=your_pkce_code_verifier"

# 3. Get User Profile & Badges
curl -X GET https://auth.avyantrix.com/api/v1/oauth/userinfo \\
  -H "Authorization: Bearer ACCESS_TOKEN"

# 4. Get 1-Click Fast Hackathon Passport
curl -X GET https://auth.avyantrix.com/api/v1/oauth/passport \\
  -H "Authorization: Bearer ACCESS_TOKEN"`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Avyantrix Identity Platform • Ecosystem Integration Docs</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Ecosystem Single Sign-On (SSO) & Passport API
        </h1>
        <p className="mt-2 text-sm text-zinc-500 max-w-3xl">
          Technical specifications for engineers connecting <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Builds</strong>, <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Challenges</strong>, and future Avyantrix platforms to central identity.
        </p>
      </div>

      {/* Discovery Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1.5">
            <Globe className="h-4 w-4" />
            OIDC Discovery
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Standard RFC 8414 metadata for zero-config client setup.
          </p>
          <a
            href="/.well-known/openid-configuration"
            target="_blank"
            className="inline-flex items-center gap-1 font-mono text-xs text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 font-medium"
          >
            /.well-known/openid-configuration <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
            <Trophy className="h-4 w-4" />
            Hackathon Passport API
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Devfolio alternative returning complete verified applicant dossiers.
          </p>
          <Link
            href="/passport"
            className="inline-flex items-center gap-1 font-mono text-xs text-zinc-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400 font-medium"
          >
            View Live Passport Card <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1.5">
            <KeyRound className="h-4 w-4" />
            Mandatory PKCE S256
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Secure code challenge protection for web and mobile clients.
          </p>
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            code_challenge_method: S256
          </span>
        </div>
      </div>

      {/* Code Snippets Box */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-xl dark:border-zinc-800 mb-10">
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("challenges")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "challenges"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              Avyantrix Challenges (Passport)
            </button>
            <button
              onClick={() => setActiveTab("builds")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "builds"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Avyantrix Builds (Bounties)
            </button>
            <button
              onClick={() => setActiveTab("nextauth")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "nextauth"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              NextAuth.js
            </button>
            <button
              onClick={() => setActiveTab("curl")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "curl"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              REST / cURL
            </button>
          </div>

          <button
            onClick={() => {
              const code =
                activeTab === "challenges"
                  ? challengesSnippet
                  : activeTab === "builds"
                  ? buildsSnippet
                  : activeTab === "nextauth"
                  ? nextAuthSnippet
                  : curlSnippet;
              copyCode(activeTab, code);
            }}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
          >
            {copiedKey === activeTab ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="p-5 overflow-x-auto">
          <pre className="font-mono text-xs text-zinc-200 leading-relaxed">
            <code>
              {activeTab === "challenges" && challengesSnippet}
              {activeTab === "builds" && buildsSnippet}
              {activeTab === "nextauth" && nextAuthSnippet}
              {activeTab === "curl" && curlSnippet}
            </code>
          </pre>
        </div>
      </div>

      {/* Scopes & Claims Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500" />
          OAuth 2.0 Scopes & Claims Reference
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pr-4">Scope</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3">Returned Payload Claims</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">openid</td>
                <td className="py-3 pr-4">Standard OpenID Connect subject ID</td>
                <td className="py-3 font-mono text-[11px]">sub, iss, aud, exp, iat</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">profile</td>
                <td className="py-3 pr-4">Full name, username, bio, and avatar</td>
                <td className="py-3 font-mono text-[11px]">name, given_name, family_name, preferred_username, picture, headline</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">email</td>
                <td className="py-3 pr-4">Primary email & verification status</td>
                <td className="py-3 font-mono text-[11px]">email, email_verified</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">roles</td>
                <td className="py-3 pr-4">Assigned ecosystem clearance roles</td>
                <td className="py-3 font-mono text-[11px]">roles: ["BUILDER", "PROBLEM_OWNER", ...]</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">clearances</td>
                <td className="py-3 pr-4">Active verification badges & certifications</td>
                <td className="py-3 font-mono text-[11px]">badges: [&#123; category, badgeLabel, issuedAt &#125;]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
