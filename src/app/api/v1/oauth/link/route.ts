import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { getGoogleAuthUrl, getGitHubAuthUrl, getAppBaseUrl } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const provider = body.provider;
    const baseUrl = getAppBaseUrl(req);

    if (provider === "google") {
      return NextResponse.json({ url: getGoogleAuthUrl("/security", baseUrl) });
    } else if (provider === "github") {
      return NextResponse.json({ url: getGitHubAuthUrl("/security", baseUrl) });
    }

    return NextResponse.json({ error: "Unsupported OAuth provider." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}
