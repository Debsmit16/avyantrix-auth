import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("verification.review");

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";
    const category = searchParams.get("category") || undefined;

    const whereClause: any = {};
    if (status !== "ALL") {
      whereClause.status = status;
    }
    if (category) {
      whereClause.category = category;
    }

    const requests = await prisma.verificationRequest.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            profile: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        evidence: true, // Only authorized reviewers see private evidence
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Forbidden" },
      { status: 403 }
    );
  }
}
