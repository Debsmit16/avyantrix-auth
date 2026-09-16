import { NextRequest, NextResponse } from "next/server";
import { getUserInfoFromBearerToken } from "@/lib/auth/oauth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const userInfo = await getUserInfoFromBearerToken(authHeader);

    return NextResponse.json(userInfo, {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "invalid_token" },
      { status: 401 }
    );
  }
}
