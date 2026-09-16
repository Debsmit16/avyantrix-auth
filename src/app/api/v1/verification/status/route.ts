import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireAuth();

    const [requests, badges] = await Promise.all([
      prisma.verificationRequest.findMany({
        where: { userId: session.userId },
        include: {
          evidence: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.verificationBadge.findMany({
        where: { userId: session.userId },
        orderBy: { issuedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      requests,
      badges,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}
