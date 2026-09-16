import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { getGoogleAuthUrl, getGitHubAuthUrl } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const provider = body.provider;

    if (provider === "google") {
      return NextResponse.json({ url: getGoogleAuthUrl() });
    } else if (provider === "github") {
      return NextResponse.json({ url: getGitHubAuthUrl() });
    }

    return NextResponse.json({ error: "Unsupported OAuth provider." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}
