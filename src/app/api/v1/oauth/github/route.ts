import { NextRequest, NextResponse } from "next/server";
import { getGitHubAuthUrl, isGitHubOAuthConfigured, getAppBaseUrl } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const baseUrl = getAppBaseUrl(req);
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("return_to") || searchParams.get("next") || "/dashboard";

  if (!isGitHubOAuthConfigured()) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=GitHub+Sign-In+is+not+configured.+Please+set+GITHUB_CLIENT_ID+and+GITHUB_CLIENT_SECRET+in+your+environment.`
    );
  }

  try {
    const url = getGitHubAuthUrl(returnTo, baseUrl);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Failed to generate GitHub Auth URL:", (error as Error).message);
    return NextResponse.redirect(
      `${baseUrl}/login?error=Failed+to+initiate+GitHub+authentication.`
    );
  }
}
