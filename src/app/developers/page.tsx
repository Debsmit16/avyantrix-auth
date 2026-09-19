"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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
  RefreshCw,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface DeveloperApp {
  id: string;
  clientId: string;
  name: string;
  redirectUris: string[];
  allowedOrigins: string[];
  createdAt: string;
}

export default function DevelopersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"challenges" | "builds" | "nextauth" | "curl">("challenges");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Developer Apps State
  const [apps, setApps] = useState<DeveloperApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppRedirectUri, setNewAppRedirectUri] = useState("http://localhost:3000/api/auth/callback");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Generated Secret Modal State
  const [generatedSecretData, setGeneratedSecretData] = useState<{
    clientId: string;
    clientSecret: string;
    name: string;
  } | null>(null);

  // Interactive .env generator state
  const [selectedApp, setSelectedApp] = useState<string>("challenges");
  const [environment, setEnvironment] = useState<"prod" | "local">("prod");

  useEffect(() => {
    if (user) {
      loadApps();
    }
  }, [user]);

  const loadApps = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch("/api/v1/developer/apps");
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch (err) {
      console.error("Error loading developer apps:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const uris = newAppRedirectUri
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      const res = await fetch("/api/v1/developer/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAppName,
          redirectUris: uris,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create application");
      }

      setGeneratedSecretData({
        clientId: data.app.clientId,
        clientSecret: data.clientSecret,
        name: data.app.name,
      });

      setShowCreateModal(false);
      setNewAppName("");
      setNewAppRedirectUri("http://localhost:3000/api/auth/callback");
      loadApps();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm("Are you sure you want to delete this OAuth application? Any integrations using this Client ID will immediately stop working.")) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/developer/apps/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApps(apps.filter((a) => a.id !== id));
      }
    } catch (err) {
      alert("Failed to delete application");
    }
  };

  const handleRotateSecret = async (id: string, name: string, clientId: string) => {
    if (!confirm(`Rotate secret for "${name}"? The previous secret will stop working immediately.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/developer/apps/${id}/rotate-secret`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.clientSecret) {
        setGeneratedSecretData({
          clientId,
          clientSecret: data.clientSecret,
          name,
        });
      }
    } catch (err) {
      alert("Failed to rotate secret");
    }
  };

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
AVYANTRIX_CLIENT_SECRET="YOUR_ECOSYSTEM_CLIENT_SECRET"
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
AVYANTRIX_CLIENT_SECRET="YOUR_ECOSYSTEM_CLIENT_SECRET"
NEXTAUTH_URL="${environment === "prod" ? "https://challenges.avyantrix.com" : "http://localhost:3002"}"
AVYANTRIX_REDIRECT_URI="${redirectUri}"
AVYANTRIX_SCOPES="openid profile email roles clearances"`;
    }

    // Custom app selected from user's apps
    const userApp = apps.find((a) => a.clientId === selectedApp);
    const clientId = userApp ? userApp.clientId : selectedApp;
    const uri = userApp && userApp.redirectUris[0] ? userApp.redirectUris[0] : "http://localhost:3000/api/auth/callback";

    return `# ${userApp ? userApp.name : "Custom App"} - Environment Variables (.env.local)
NEXT_PUBLIC_AVYANTRIX_ISSUER="https://auth.avyantrix.com"
AVYANTRIX_CLIENT_ID="${clientId}"
AVYANTRIX_CLIENT_SECRET="YOUR_GENERATED_CLIENT_SECRET"
AVYANTRIX_REDIRECT_URI="${uri}"
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
          <span>Avyantrix Identity Platform • Developer Console</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Developer Applications & SSO API
        </h1>
        <p className="mt-2 text-sm text-zinc-500 max-w-3xl">
          Register OAuth applications, generate API keys and client secrets, and connect <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Builds</strong>, <strong className="text-zinc-700 dark:text-zinc-300">Avyantrix Challenges</strong>, or third-party platforms to Avyantrix ID.
        </p>
      </div>

      {/* Self-Service OAuth Applications & Keys Management Box */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-red-500" />
              My OAuth Applications & API Secrets
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Create and manage client credentials for your web apps, backends, and hackathon portals.
            </p>
          </div>

          {user ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-xs transition-colors shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Register New Application</span>
            </button>
          ) : (
            <Link
              href="/login?redirect=/developers"
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-xs transition-colors shrink-0"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Sign In to Generate Keys</span>
            </Link>
          )}
        </div>

        {/* User Application List */}
        {user ? (
          <div>
            {loadingApps ? (
              <div className="py-8 text-center text-xs text-zinc-500">Loading your registered apps...</div>
            ) : apps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
                <Shield className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  No Applications Registered Yet
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Register your first OAuth client to generate a Client ID and Secret for your app or hackathon integration.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Register Application Now</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {apps.map((app) => (
                  <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{app.name}</span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {app.clientId}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">
                        Redirects: {app.redirectUris.join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyCode(app.clientId, app.clientId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedKey === app.clientId ? "ID Copied" : "Copy Client ID"}
                      </button>
                      <button
                        onClick={() => handleRotateSecret(app.id, app.name, app.clientId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        title="Rotate Client Secret"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Rotate Secret</span>
                      </button>
                      <button
                        onClick={() => handleDeleteApp(app.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete Application"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 p-6 text-center border border-zinc-100 dark:border-zinc-800">
            <KeyRound className="mx-auto h-7 w-7 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Developer Self-Service Portal
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Sign in with your Avyantrix ID to register applications, generate client secrets, and test OAuth 2.0 PKCE authentication.
            </p>
          </div>
        )}
      </div>

      {/* Generated Secret Modal (Displayed Once on Creation or Rotation) */}
      {generatedSecretData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:border-emerald-500/30 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Client Credentials Generated!
                </h3>
                <p className="text-xs text-zinc-500">
                  {generatedSecretData.name}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Important:</strong> Please copy your Client Secret now. For security, we do not store raw secrets and you won't be able to see it again!
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Client ID
                </label>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                  <span>{generatedSecretData.clientId}</span>
                  <button
                    onClick={() => copyCode("modal_id", generatedSecretData.clientId)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                  >
                    {copiedKey === "modal_id" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Client Secret (Copy Now)
                </label>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/40 p-2.5 font-mono text-xs text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                  <span className="break-all">{generatedSecretData.clientSecret}</span>
                  <button
                    onClick={() => copyCode("modal_secret", generatedSecretData.clientSecret)}
                    className="ml-2 text-red-500 hover:text-red-700 shrink-0"
                  >
                    {copiedKey === "modal_secret" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setGeneratedSecretData(null)}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              >
                I have saved my secret securely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register App Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateApp}
            className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:border-zinc-800 space-y-4 animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Register New OAuth App
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Cancel
              </button>
            </div>

            {createError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
                {createError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Application Name
              </label>
              <input
                type="text"
                required
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="e.g. Stanford Hackathon 2026 Portal"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-2xs focus:border-red-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Callback / Redirect URIs (comma-separated)
              </label>
              <input
                type="text"
                required
                value={newAppRedirectUri}
                onChange={(e) => setNewAppRedirectUri(e.target.value)}
                placeholder="http://localhost:3000/api/auth/callback, https://myapp.com/callback"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 shadow-2xs focus:border-red-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Must be an exact URL match where your app receives OAuth codes.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Generating Keys..." : "Generate Client ID & Secret"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive .env Environment Variable Generator */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-red-500" />
              Interactive .env Config Generator
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select your registered app or ecosystem target to generate ready-to-paste environment variables.
            </p>
          </div>

          {/* App Selector Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex-wrap">
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
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app.clientId)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedApp === app.clientId
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {app.name}
              </button>
            ))}
          </div>
        </div>

        {/* Environment Toggle */}
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
    </div>
  );
}
