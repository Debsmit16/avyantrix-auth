import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Validates whether an incoming request Origin is permitted to communicate with Avyantrix OAuth endpoints.
 * Permitted:
 * 1. Registered allowedOrigins in the OAuthClient table.
 * 2. First-party Avyantrix subdomains (*.avyantrix.com).
 * 3. Localhost development environments (http://localhost:*, http://127.0.0.1:*).
 */
export async function isAllowedOrigin(origin: string | null): Promise<boolean> {
  if (!origin) return true; // Non-browser / same-origin requests

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // 1. Localhost development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }

    // 2. Avyantrix subdomains
    if (hostname === "avyantrix.com" || hostname.endsWith(".avyantrix.com")) {
      return true;
    }

    // 3. Registered external OAuth client origins
    const clients = await prisma.oAuthClient.findMany({
      select: { allowedOrigins: true },
    });

    for (const client of clients) {
      if (client.allowedOrigins.includes(origin) || client.allowedOrigins.includes("*")) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function getCorsHeaders(origin: string | null = "*") {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With, Sentry-Trace, Baggage",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

export async function handleCorsPreflight(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get("origin");
  const allowed = await isAllowedOrigin(origin);

  if (!allowed && origin) {
    return new NextResponse(null, { status: 403, statusText: "Forbidden Origin" });
  }

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin || "*"),
  });
}
