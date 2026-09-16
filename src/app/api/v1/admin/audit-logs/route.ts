import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("admin.view_audit");

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "security"; // 'security' or 'login'
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const skip = (page - 1) * limit;

    if (type === "login") {
      const [events, total] = await Promise.all([
        prisma.loginEvent.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.loginEvent.count(),
      ]);

      return NextResponse.json({
        events,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.securityEvent.count(),
    ]);

    return NextResponse.json({
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Forbidden" },
      { status: 403 }
    );
  }
}
