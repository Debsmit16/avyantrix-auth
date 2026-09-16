import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { destroySessionById } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const sessionId = params.id;

    const success = await destroySessionById(sessionId, session.userId);
    if (!success) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    await logSecurityEvent({
      userId: session.userId,
      eventType: "SESSION_REVOKED",
      ipAddress: ip,
      metadata: { targetSessionId: sessionId },
    });

    return NextResponse.json({ message: "Session revoked successfully." });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}
