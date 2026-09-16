import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("admin.manage_users");

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (query) {
      whereClause.OR = [
        { email: { contains: query, mode: "insensitive" } },
        { profile: { username: { contains: query, mode: "insensitive" } } },
        { profile: { firstName: { contains: query, mode: "insensitive" } } },
        { profile: { lastName: { contains: query, mode: "insensitive" } } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
          verificationBadges: true,
          _count: {
            select: { sessions: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        emailVerified: u.emailVerified,
        status: u.status,
        createdAt: u.createdAt,
        profile: u.profile,
        roles: u.userRoles.map((ur) => ur.role.name),
        badges: u.verificationBadges,
        activeSessionsCount: u._count.sessions,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Forbidden" },
      { status: 403 }
    );
  }
}
