import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/rbac";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const session = await requireRole(["ADMIN"]);
    const { id } = params;

    const client = await prisma.oAuthClient.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { error: "OAuth application not found." },
        { status: 404 }
      );
    }

    await prisma.oAuthClient.delete({
      where: { id },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "ROLE_REVOKED",
      ipAddress: ip,
      metadata: { action: "oauth_client_deleted", clientId: client.clientId },
    });

    return NextResponse.json({
      message: `OAuth application '${client.name}' (${client.clientId}) has been deleted.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete OAuth application." },
      { status: 500 }
    );
  }
}
