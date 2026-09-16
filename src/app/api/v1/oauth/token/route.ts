import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode } from "@/lib/auth/oauth-server";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = await checkRateLimit(`oauth_token:${ip}`, 60, 60);

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many token exchange requests. Please try again later." },
        { status: 429 }
      );
    }

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const {
      grant_type,
      client_id,
      client_secret,
      code,
      redirect_uri,
      code_verifier,
    } = body;

    if (grant_type !== "authorization_code") {
      return NextResponse.json(
        { error: "unsupported_grant_type. Only 'authorization_code' is supported." },
        { status: 400 }
      );
    }

    if (!client_id || !code || !redirect_uri) {
      return NextResponse.json(
        { error: "invalid_request. Missing client_id, code, or redirect_uri." },
        { status: 400 }
      );
    }

    const tokenResponse = await exchangeAuthorizationCode({
      clientId: client_id,
      clientSecret: client_secret,
      code,
      redirectUri: redirect_uri,
      codeVerifier: code_verifier,
    });

    return NextResponse.json(tokenResponse, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("OAuth Token Exchange Error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "invalid_grant" },
      { status: 400 }
    );
  }
}
