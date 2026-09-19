import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
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

    const newRawSecret = `avy_sec_${crypto.randomBytes(24).toString("hex")}`;
    const newSecretHash = await hashPassword(newRawSecret);

    await prisma.oAuthClient.update({
      where: { id: app.id },
      data: { clientSecretHash: newSecretHash },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "DEVELOPER_APP_SECRET_ROTATED",
      metadata: {
        clientId: app.clientId,
        name: app.name,
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: newRawSecret,
    });
  } catch (error) {
    console.error("Rotate secret error:", error);
    return NextResponse.json({ error: "Failed to rotate secret" }, { status: 500 });
  }
}
