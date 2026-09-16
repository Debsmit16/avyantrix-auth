import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const url = getGoogleAuthUrl();
  return NextResponse.redirect(url);
}
