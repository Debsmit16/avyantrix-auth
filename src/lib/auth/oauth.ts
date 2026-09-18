import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * Dynamically resolve authoritative application base URL from incoming request or environment.
 */
export function getAppBaseUrl(req?: NextRequest): string {
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
    if (host) {
      return `${proto}://${host}`;
    }
  }
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com";
}

/**
 * Generate cryptographically secure OAuth state with embedded return URL.
 */
export function generateOAuthState(returnTo: string = "/dashboard"): string {
  const randomHex = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ r: randomHex, next: returnTo });
  const state = Buffer.from(payload).toString("base64url");

  cookies().set({
    name: "oauth_state",
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return state;
}

/**
 * Validate OAuth state and extract the original destination URL.
 */
export function validateOAuthState(state: string): { valid: boolean; returnTo: string } {
  const savedState = cookies().get("oauth_state")?.value;
  cookies().delete("oauth_state");

  if (!savedState || savedState !== state) {
    return { valid: false, returnTo: "/dashboard" };
  }

  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);
    const returnTo =
      typeof parsed.next === "string" && (parsed.next.startsWith("/") || parsed.next.startsWith("https://"))
        ? parsed.next
        : "/dashboard";
    return { valid: true, returnTo };
  } catch {
    return { valid: true, returnTo: "/dashboard" };
  }
}

// ==========================================
// Google OAuth Helpers
// ==========================================

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleAuthUrl(returnTo: string = "/dashboard", baseUrl?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in environment variables.");
  }

  const appBase = baseUrl || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com";
  const state = generateOAuthState(returnTo);
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const redirectUri = `${appBase}/api/v1/oauth/google/callback`;

  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ].join(" "),
    state,
  };

  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

export async function getGoogleUser(
  code: string,
  baseUrl?: string
): Promise<{
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}> {
  const appBase = baseUrl || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com";
  const redirectUri = `${appBase}/api/v1/oauth/google/callback`;
  const tokenUrl = "https://oauth2.googleapis.com/token";

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange Google OAuth code.");
  }

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch Google user profile.");
  }

  return await userResponse.json();
}

// ==========================================
// GitHub OAuth Helpers
// ==========================================

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function getGitHubAuthUrl(returnTo: string = "/dashboard", baseUrl?: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID is not configured in environment variables.");
  }

  const appBase = baseUrl || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com";
  const state = generateOAuthState(returnTo);
  const rootUrl = "https://github.com/login/oauth/authorize";
  const redirectUri = `${appBase}/api/v1/oauth/github/callback`;

  const options = {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  };

  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

export async function getGitHubUser(
  code: string,
  baseUrl?: string
): Promise<{
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}> {
  const tokenUrl = "https://github.com/login/oauth/access_token";

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || tokenData.error) {
    throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange GitHub OAuth code.");
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "Avyantrix-Auth",
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch GitHub user profile.");
  }

  const userData = await userResponse.json();

  // If primary email is private on GitHub profile, fetch from verified emails endpoint
  let primaryEmail = userData.email;
  if (!primaryEmail) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "Avyantrix-Auth",
      },
    });
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      if (Array.isArray(emails)) {
        const primary = emails.find((e: any) => e.primary && e.verified) || emails.find((e: any) => e.verified);
        if (primary) primaryEmail = primary.email;
      }
    }
  }

  return {
    id: String(userData.id),
    login: userData.login,
    name: userData.name,
    email: primaryEmail,
    avatar_url: userData.avatar_url,
  };
}
