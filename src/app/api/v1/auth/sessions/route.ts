import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireAuth();

    const sessions = await prisma.session.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceInfo: true,
        createdAt: true,
        lastActiveAt: true,
        expiresAt: true,
      },
      orderBy: { lastActiveAt: "desc" },
    });

    return NextResponse.json({
      currentSessionId: session.id,
      sessions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}
