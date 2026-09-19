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
} from "lucide-react";

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<"challenges" | "builds" | "nextauth" | "curl">("challenges");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const challengesSnippet = `// Avyantrix Challenges - 1-Click Fast Hackathon Application Integration
import { getAvyantrixPassport } from "@avyantrix/sdk";

export async function handleHackathonApplication(accessToken: string, hackathonId: string) {
  // Fetch authoritative, verified passport in 1 line
  const res = await fetch("https://auth.avyantrix.com/api/v1/oauth/passport", {
    headers: {
      Authorization: \`Bearer \${accessToken}\`,
    },
  });

  const passport = await res.json();

  // Instant pre-population of hackathon application:
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
    appliedAt: new Date(),
  };
}`;

  const buildsSnippet = `// Avyantrix Builds - Problem Owner & Builder Clearance Verification
export async function verifyBuilderClearance(bearerToken: string) {
  const res = await fetch("https://auth.avyantrix.com/api/v1/oauth/userinfo", {
    headers: {
      Authorization: \`Bearer \${bearerToken}\`,
    },
  });

  const userInfo = await res.json();

  const isVerifiedBuilder = userInfo.roles.includes("BUILDER") ||
    userInfo.badges.some((b: any) => b.category === "CAPABILITY_BUILDER");

  const isProblemOwner = userInfo.roles.includes("PROBLEM_OWNER");

  return {
    userId: userInfo.sub,
    username: userInfo.preferred_username,
    canClaimBounties: isVerifiedBuilder,
    canPostProblems: isProblemOwner,
    badges: userInfo.badges,
  };
}`;

  const nextAuthSnippet = `// NextAuth.js / Auth.js Custom OIDC Provider Configuration
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

  const curlSnippet = `# 1. Direct OIDC Discovery
curl -X GET https://auth.avyantrix.com/.well-known/openid-configuration

# 2. Exchange Authorization Code with PKCE S256 for Tokens
curl -X POST https://auth.avyantrix.com/api/v1/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=your_client_id" \\
  -d "code=auth_code_here" \\
  -d "redirect_uri=https://challenges.avyantrix.com/api/auth/callback" \\
  -d "code_verifier=your_pkce_code_verifier"

# 3. Retrieve User Profile & Badges
curl -X GET https://auth.avyantrix.com/api/v1/oauth/userinfo \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Retrieve Fast Hackathon Passport
curl -X GET https://auth.avyantrix.com/api/v1/oauth/passport \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 mb-3">
          <Code2 className="h-3.5 w-3.5" />
          <span>Avyantrix Identity Platform • Developer Docs</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Ecosystem Single Sign-On (SSO) & Passport API
        </h1>
        <p className="mt-2 text-sm text-zinc-500 max-w-3xl">
          Integrate Avyantrix Auth as your universal identity provider. Powering 1-click hackathon applications on <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Challenges</strong> and deep-tech problem solving on <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Builds</strong>.
        </p>
      </div>

      {/* Quick Discovery Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1.5">
            <Globe className="h-4 w-4" />
            OIDC Discovery
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Standard RFC 8414 metadata with automatic endpoint discovery.
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
            Devfolio replacement endpoint returning complete applicant packages.
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
            Protected against authorization code interception attacks.
          </p>
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            code_challenge_method: S256
          </span>
        </div>
      </div>

      {/* Code Integration Playground */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-xl dark:border-zinc-800 mb-10">
        {/* Tab Selector */}
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
              NextAuth.js Setup
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

        {/* Code Content */}
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

      {/* Scopes & Claims Reference Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500" />
          Supported OAuth 2.0 Scopes & Claims
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pr-4">Scope</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3">Returned Claims</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">openid</td>
                <td className="py-3 pr-4">Standard OpenID Connect subject identifier</td>
                <td className="py-3 font-mono text-[11px]">sub, iss, aud, exp, iat</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">profile</td>
                <td className="py-3 pr-4">Developer profile metadata & avatar</td>
                <td className="py-3 font-mono text-[11px]">name, given_name, family_name, preferred_username, picture, headline</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">email</td>
                <td className="py-3 pr-4">User primary email & verification status</td>
                <td className="py-3 font-mono text-[11px]">email, email_verified</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">roles</td>
                <td className="py-3 pr-4">Assigned ecosystem clearance roles</td>
                <td className="py-3 font-mono text-[11px]">roles: ["BUILDER", "PROBLEM_OWNER", ...]</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-red-600 dark:text-red-400">clearances</td>
                <td className="py-3 pr-4">Active verification badges and certifications</td>
                <td className="py-3 font-mono text-[11px]">badges: [&#123; category, badgeLabel, issuedAt &#125;]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
