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
  PlusCircle,
  Settings,
  Lock,
  Cpu,
} from "lucide-react";

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<"challenges" | "builds" | "nextauth" | "curl">("challenges");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive .env generator state
  const [selectedApp, setSelectedApp] = useState<"builds" | "challenges" | "custom">("challenges");
  const [environment, setEnvironment] = useState<"prod" | "local">("prod");
  const [customClientId, setCustomClientId] = useState("my_custom_app");
  const [customPort, setCustomPort] = useState("3001");

  const copyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getEnvConfig = () => {
    if (selectedApp === "builds") {
      const redirectUri =
        environment === "prod"
          ? "https://builds.avyantrix.com/api/auth/callback"
          : "http://localhost:3001/api/auth/callback";
      return `# Avyantrix Builds - Environment Variables (.env.local)
NEXT_PUBLIC_AVYANTRIX_ISSUER="https://auth.avyantrix.com"
AVYANTRIX_CLIENT_ID="avyantrix_builds"
AVYANTRIX_CLIENT_SECRET="YOUR_CLIENT_SECRET_FROM_ADMIN_CONSOLE"
NEXTAUTH_URL="${environment === "prod" ? "https://builds.avyantrix.com" : "http://localhost:3001"}"
AVYANTRIX_REDIRECT_URI="${redirectUri}"
AVYANTRIX_SCOPES="openid profile email roles clearances"`;
    }

    if (selectedApp === "challenges") {
      const redirectUri =
        environment === "prod"
          ? "https://challenges.avyantrix.com/api/auth/callback"
          : "http://localhost:3002/api/auth/callback";
      return `# Avyantrix Challenges - Environment Variables (.env.local)
NEXT_PUBLIC_AVYANTRIX_ISSUER="https://auth.avyantrix.com"
AVYANTRIX_CLIENT_ID="avyantrix_challenges"
AVYANTRIX_CLIENT_SECRET="YOUR_CLIENT_SECRET_FROM_ADMIN_CONSOLE"
NEXTAUTH_URL="${environment === "prod" ? "https://challenges.avyantrix.com" : "http://localhost:3002"}"
AVYANTRIX_REDIRECT_URI="${redirectUri}"
AVYANTRIX_SCOPES="openid profile email roles clearances"`;
    }

    return `# Custom Ecosystem App - Environment Variables (.env.local)
NEXT_PUBLIC_AVYANTRIX_ISSUER="https://auth.avyantrix.com"
AVYANTRIX_CLIENT_ID="${customClientId}"
AVYANTRIX_CLIENT_SECRET="YOUR_CLIENT_SECRET_FROM_ADMIN_CONSOLE"
AVYANTRIX_REDIRECT_URI="${
      environment === "prod"
        ? `https://${customClientId}.avyantrix.com/api/auth/callback`
        : `http://localhost:${customPort}/api/auth/callback`
    }"
AVYANTRIX_SCOPES="openid profile email roles clearances"`;
  };

  const challengesSnippet = `// 1. Avyantrix Challenges - 1-Click Fast Hackathon Application
// When a builder applies to a hackathon, fetch their verified passport in 1 line:
export async function fetchApplicantPassport(accessToken: string) {
  const res = await fetch("https://auth.avyantrix.com/api/v1/oauth/passport", {
    headers: { Authorization: \`Bearer \${accessToken}\` },
  });

  const passport = await res.json();

  // Instant pre-population without asking users to type repetitive forms:
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Avyantrix Identity Platform • Developer & Ecosystem Hub</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Ecosystem Single Sign-On (SSO) & Application Integration
        </h1>
        <p className="mt-2 text-sm text-zinc-500 max-w-3xl">
          Complete integration guide and credential manager for connecting <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Builds</strong>, <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Challenges</strong>, and future platforms to central identity.
        </p>
      </div>

      {/* 3-Step Quickstart Architecture */}
      <div className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50 to-red-50/20 p-6 sm:p-8 dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/20 shadow-xs">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-red-500" />
          How to Connect Any Avyantrix App in 3 Simple Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-600 text-white font-bold text-xs">
                1
              </span>
              <span className="text-[11px] font-mono text-zinc-400">Step 1</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Register OAuth Application
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Create an OAuth 2.0 client entry to obtain your unique <code className="text-red-500 font-mono">Client ID</code> and <code className="text-red-500 font-mono">Client Secret</code>.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Open Admin Application Registry &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-600 text-white font-bold text-xs">
                2
              </span>
              <span className="text-[11px] font-mono text-zinc-400">Step 2</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Configure .env Credentials
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Add the generated Client ID, Secret, and Redirect URIs into your target application's <code className="text-zinc-700 dark:text-zinc-300 font-mono">.env.local</code>.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
                <Settings className="h-3.5 w-3.5 text-zinc-400" />
                <span>Use generator below</span>
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-600 text-white font-bold text-xs">
                3
              </span>
              <span className="text-[11px] font-mono text-zinc-400">Step 3</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Fetch Verified Identity
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Call <code className="text-zinc-700 dark:text-zinc-300 font-mono">/oauth/passport</code> or <code className="text-zinc-700 dark:text-zinc-300 font-mono">/oauth/userinfo</code> to get 1-click hackathon applications & role badges.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>1-Line integration</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive .env Environment Variable Generator */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-red-500" />
              Interactive .env Config Generator
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select your application and environment to generate ready-to-paste environment variables.
            </p>
          </div>

          {/* App Selector Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedApp("challenges")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedApp === "challenges"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Challenges
            </button>
            <button
              onClick={() => setSelectedApp("builds")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedApp === "builds"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Builds
            </button>
            <button
              onClick={() => setSelectedApp("custom")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedApp === "custom"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Custom App
            </button>
          </div>
        </div>

        {/* Environment Toggle & Custom Fields */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Target Environment:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEnvironment("prod")}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border ${
                  environment === "prod"
                    ? "border-red-500/40 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400"
                    : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                Production (Cloud)
              </button>
              <button
                onClick={() => setEnvironment("local")}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border ${
                  environment === "local"
                    ? "border-red-500/40 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400"
                    : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                Local Dev (localhost)
              </button>
            </div>
          </div>

          {selectedApp === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">Client ID:</span>
              <input
                type="text"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Generated .env Code Block */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <button
            onClick={() => copyCode("env", getEnvConfig())}
            className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            {copiedKey === "env" ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy .env</span>
              </>
            )}
          </button>
          <pre className="font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed pt-2">
            <code>{getEnvConfig()}</code>
          </pre>
        </div>
      </div>

      {/* Code Snippets Playground */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-xl dark:border-zinc-800">
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

      {/* Scopes & Claims Reference */}
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
