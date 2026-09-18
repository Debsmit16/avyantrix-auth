import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { createAuthorizationCode } from "@/lib/auth/oauth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("client_id");
    const redirectUri = searchParams.get("redirect_uri");
    const responseType = searchParams.get("response_type") || "code";
    const state = searchParams.get("state") || "";
    const scope = searchParams.get("scope") || "openid profile email";
    const codeChallenge = searchParams.get("code_challenge") || undefined;
    const codeChallengeMethod = searchParams.get("code_challenge_method") || undefined;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Missing required client_id or redirect_uri parameter" },
        { status: 400 }
      );
    }

    if (responseType !== "code") {
      return NextResponse.json(
        { error: "Unsupported response_type. Only 'code' is supported." },
        { status: 400 }
      );
    }

    // 1. Check if user already has an active host-only session at auth.avyantrix.com
    const session = await getSession();

    if (!session) {
      // User is not signed into central Auth: redirect to login page with return URL
      const currentUrl = req.url;
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("return_to", currentUrl);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Validate Client and check consent requirement
    const client = await prisma.oAuthClient.findUnique({
      where: { clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Invalid OAuth client_id" },
        { status: 400 }
      );
    }

    const consented = searchParams.get("consented");
    if (!client.isFirstParty && consented !== "true") {
      const consentUrl = new URL("/oauth/consent", req.url);
      consentUrl.search = searchParams.toString();
      return NextResponse.redirect(consentUrl);
    }

    // 3. User is signed in and consented: Issue short-lived, single-use authorization code
    const code = await createAuthorizationCode({
      clientId,
      userId: session.userId,
      redirectUri,
      scope,
      codeChallenge,
      codeChallengeMethod,
    });

    // 4. Redirect back to downstream product (Builds, Challenges, etc.)
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set("code", code);
    if (state) {
      callbackUrl.searchParams.set("state", state);
    }

    return NextResponse.redirect(callbackUrl);
  } catch (error) {
    console.error("OAuth Authorize Error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "OAuth authorization failed" },
      { status: 400 }
    );
  }
}
