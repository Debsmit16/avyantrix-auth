import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleOAuthConfigured, getAppBaseUrl } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const baseUrl = getAppBaseUrl(req);
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("return_to") || searchParams.get("next") || "/dashboard";

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=Google+Sign-In+is+not+configured.+Please+set+GOOGLE_CLIENT_ID+and+GOOGLE_CLIENT_SECRET+in+your+environment.`
    );
  }

  try {
    const url = getGoogleAuthUrl(returnTo, baseUrl);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Failed to generate Google Auth URL:", (error as Error).message);
    return NextResponse.redirect(
      `${baseUrl}/login?error=Failed+to+initiate+Google+authentication.`
    );
  }
}
