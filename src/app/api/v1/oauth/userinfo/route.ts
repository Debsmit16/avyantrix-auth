import { NextRequest, NextResponse } from "next/server";
import { getUserInfoFromBearerToken } from "@/lib/auth/oauth-server";
import { handleCorsPreflight, getCorsHeaders } from "@/lib/auth/cors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get("authorization");
    const userInfo = await getUserInfoFromBearerToken(authHeader);

    return NextResponse.json(userInfo, {
      headers: {
        ...cors,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "invalid_token" },
      {
        status: 401,
        headers: cors,
      }
    );
  }
}
