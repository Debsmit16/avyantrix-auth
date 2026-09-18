import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode, refreshAccessToken } from "@/lib/auth/oauth-server";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { handleCorsPreflight, getCorsHeaders } from "@/lib/auth/cors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = await checkRateLimit(`oauth_token:${ip}`, 60, 60);

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many token exchange requests. Please try again later." },
        { status: 429, headers: cors }
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
      refresh_token,
    } = body;

    // Handle grant_type: authorization_code
    if (grant_type === "authorization_code") {
      if (!client_id || !code || !redirect_uri) {
        return NextResponse.json(
          { error: "invalid_request. Missing client_id, code, or redirect_uri." },
          { status: 400, headers: cors }
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
          ...cors,
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });
    }

    // Handle grant_type: refresh_token
    if (grant_type === "refresh_token") {
      if (!client_id || !refresh_token) {
        return NextResponse.json(
          { error: "invalid_request. Missing client_id or refresh_token." },
          { status: 400, headers: cors }
        );
      }

      const tokenResponse = await refreshAccessToken({
        clientId: client_id,
        clientSecret: client_secret,
        refreshToken: refresh_token,
      });

      return NextResponse.json(tokenResponse, {
        status: 200,
        headers: {
          ...cors,
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });
    }

    return NextResponse.json(
      { error: "unsupported_grant_type. Supported grants: 'authorization_code', 'refresh_token'." },
      { status: 400, headers: cors }
    );
  } catch (error) {
    console.error("OAuth Token Exchange Error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "invalid_grant" },
      { status: 400, headers: cors }
    );
  }
}
