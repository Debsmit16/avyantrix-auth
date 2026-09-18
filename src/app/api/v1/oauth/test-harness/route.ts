import { NextResponse } from "next/server";
import { AvyantrixSSOClient } from "@/lib/sdk/avyantrix-sso";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const client = new AvyantrixSSOClient({
      issuerUrl: process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com",
      clientId: "avyantrix_builds",
      redirectUri: "https://builds.avyantrix.com/api/auth/callback",
    });

    const { codeVerifier, codeChallenge } = client.generatePkce();
    const authUrl = client.getAuthorizationUrl({
      state: "test-csrf-state-12345",
      codeChallenge,
    });

    return NextResponse.json({
      success: true,
      testResults: {
        pkceVerification: {
          codeVerifierLength: codeVerifier.length,
          codeChallengeLength: codeChallenge.length,
          method: "S256",
        },
        constructedAuthUrl: authUrl,
        sdkInitialized: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "SDK Test harness failure." },
      { status: 500 }
    );
  }
}
