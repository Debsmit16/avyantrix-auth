import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { destroyAllUserSessions } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const adminSession = await requirePermission("admin.manage_users");
    const targetUserId = params.id;
    const body = await req.json();
    const status = body.status;

    if (!["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { status },
    });

    if (status === "SUSPENDED") {
      // Immediately invalidate all sessions if account suspended
      await destroyAllUserSessions(targetUserId);
    }

    await logSecurityEvent({
      userId: adminSession.userId,
      eventType: "ACCOUNT_SUSPENDED",
      ipAddress: ip,
      metadata: { targetUserId, newStatus: status },
    });

    return NextResponse.json({
      message: `User status updated to ${status}.`,
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Forbidden" },
      { status: 403 }
    );
  }
}
