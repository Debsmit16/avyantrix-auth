import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function verifyCronAuth(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const xCronSecret = req.headers.get("x-cron-secret");

  // If CRON_SECRET is configured, check bearer token or custom header
  if (cronSecret) {
    if (xCronSecret === cronSecret) return true;
    if (authHeader && authHeader === `Bearer ${cronSecret}`) return true;
  }

  // Fallback: Allow authenticated ADMIN session
  const session = await getSession();
  if (session && session.roles.includes("ADMIN")) {
    return true;
  }

  // If no CRON_SECRET is set in local dev, allow request
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    return true;
  }

  return false;
}

async function performCleanup() {
  const startTime = Date.now();
  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [rateLimits, verificationTokens, authorizationCodes, refreshTokens, sessions] =
    await Promise.all([
      // 1. Purge expired rate limit buckets
      prisma.rateLimitRecord.deleteMany({
        where: { expiresAt: { lt: now } },
      }),

      // 2. Purge expired or consumed email/password/magic tokens
      prisma.verificationToken.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
        },
      }),

      // 3. Purge expired or consumed single-use OAuth authorization codes
      prisma.authorizationCode.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
        },
      }),

      // 4. Purge expired OAuth refresh tokens and revoked tokens older than 30 days
      prisma.oAuthRefreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isRevoked: true, createdAt: { lt: thirtyDaysAgo } },
          ],
        },
      }),

      // 5. Purge expired user sessions
      prisma.session.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    timestamp: now.toISOString(),
    durationMs,
    cleaned: {
      rateLimits: rateLimits.count,
      verificationTokens: verificationTokens.count,
      authorizationCodes: authorizationCodes.count,
      refreshTokens: refreshTokens.count,
      sessions: sessions.count,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyCronAuth(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized cron execution." },
        { status: 401 }
      );
    }

    const result = await performCleanup();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cleanup cron error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "Cleanup failed." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyCronAuth(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized cron execution." },
        { status: 401 }
      );
    }

    const result = await performCleanup();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cleanup cron error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "Cleanup failed." },
      { status: 500 }
    );
  }
}
