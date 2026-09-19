import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const app = await prisma.oAuthClient.findUnique({
      where: { id: params.id },
    });

    if (!app || app.ownerUserId !== session.userId) {
      return NextResponse.json({ error: "Application not found or unauthorized" }, { status: 404 });
    }

    await prisma.oAuthClient.delete({
      where: { id: app.id },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "DEVELOPER_APP_DELETED",
      metadata: {
        clientId: app.clientId,
        name: app.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete developer app error:", error);
    return NextResponse.json({ error: "Failed to delete developer application" }, { status: 500 });
  }
}
