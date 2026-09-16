import { NextRequest, NextResponse } from "next/server";
import { getSession, destroyAllUserSessions } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await destroyAllUserSessions(session.userId);

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    await logSecurityEvent({
      userId: session.userId,
      eventType: "ALL_SESSIONS_REVOKED",
      ipAddress: ip,
      metadata: { revokedCount: count },
    });

    return NextResponse.json({
      message: `Successfully logged out from all ${count} active sessions.`,
    });
  } catch (error) {
    console.error("Logout-all error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to revoke all sessions." },
      { status: 500 }
    );
  }
}
