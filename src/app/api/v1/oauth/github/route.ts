import { NextResponse } from "next/server";
import { getGitHubAuthUrl } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const url = getGitHubAuthUrl();
  return NextResponse.redirect(url);
}
