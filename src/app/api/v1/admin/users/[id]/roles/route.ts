import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const adminSession = await requirePermission("admin.manage_users");
    const targetUserId = params.id;
    const body = await req.json();
    const roles: string[] = body.roles; // Array of role names

    if (!Array.isArray(roles)) {
      return NextResponse.json({ error: "Roles must be an array of role names." }, { status: 400 });
    }

    const availableRoles = await prisma.role.findMany({
      where: { name: { in: roles } },
    });

    if (availableRoles.length !== roles.length) {
      return NextResponse.json({ error: "One or more role names are invalid." }, { status: 400 });
    }

    // Atomic update of user roles
    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId: targetUserId },
      });

      if (availableRoles.length > 0) {
        await tx.userRole.createMany({
          data: availableRoles.map((r) => ({
            userId: targetUserId,
            roleId: r.id,
            assignedBy: adminSession.userId,
          })),
        });
      }
    });

    await logSecurityEvent({
      userId: adminSession.userId,
      eventType: "ROLE_GRANTED",
      ipAddress: ip,
      metadata: { targetUserId, assignedRoles: roles },
    });

    return NextResponse.json({
      message: "User roles updated successfully.",
      roles,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Forbidden" },
      { status: 403 }
    );
  }
}
