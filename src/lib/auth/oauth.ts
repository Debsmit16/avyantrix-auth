import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export function generateOAuthState(): string {
  const state = crypto.randomBytes(24).toString("hex");
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

export function validateOAuthState(state: string): boolean {
  const savedState = cookies().get("oauth_state")?.value;
  cookies().delete("oauth_state");
  return Boolean(savedState && savedState === state);
}

// Google OAuth Helpers
export function getGoogleAuthUrl(): string {
  const state = generateOAuthState();
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/oauth/google/callback`;

  const options = {
    redirect_uri: redirectUri,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
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

export async function getGoogleUser(code: string): Promise<{
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/oauth/google/callback`;
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
    throw new Error(tokenData.error_description || "Failed to exchange Google OAuth code.");
  }

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  return await userResponse.json();
}

// GitHub OAuth Helpers
export function getGitHubAuthUrl(): string {
  const state = generateOAuthState();
  const rootUrl = "https://github.com/login/oauth/authorize";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/oauth/github/callback`;

  const options = {
    client_id: process.env.GITHUB_CLIENT_ID || "",
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  };

  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

export async function getGitHubUser(code: string): Promise<{
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
    throw new Error(tokenData.error_description || "Failed to exchange GitHub OAuth code.");
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "Avyantrix-Auth",
    },
  });

  const userData = await userResponse.json();

  // If primary email is private, fetch from emails endpoint
  let primaryEmail = userData.email;
  if (!primaryEmail) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "Avyantrix-Auth",
      },
    });
    const emails = await emailsResponse.json();
    if (Array.isArray(emails)) {
      const primary = emails.find((e: any) => e.primary && e.verified);
      if (primary) primaryEmail = primary.email;
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
