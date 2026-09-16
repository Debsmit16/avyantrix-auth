import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { destroyAllUserSessions } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // Soft delete user in Neon PostgreSQL
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
      },
    });

    await destroyAllUserSessions(session.userId);

    await logSecurityEvent({
      userId: session.userId,
      eventType: "ACCOUNT_DELETED",
      ipAddress: ip,
    });

    return NextResponse.json({
      message: "Account deleted successfully. We hope to see you build with Avyantrix again.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete account." },
      { status: 500 }
    );
  }
}
