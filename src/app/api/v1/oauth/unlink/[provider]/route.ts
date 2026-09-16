import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const session = await requireAuth();
    const provider = params.provider.toLowerCase();

    // Check user's current authentication methods
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const hasPassword = Boolean(user.passwordHash);
    const otherAccountsCount = user.accounts.filter((a) => a.provider !== provider).length;

    if (!hasPassword && otherAccountsCount === 0) {
      return NextResponse.json(
        { error: "Cannot unlink your only sign-in method. Please set a password first." },
        { status: 400 }
      );
    }

    await prisma.account.deleteMany({
      where: {
        userId: session.userId,
        provider,
      },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "OAUTH_UNLINKED",
      ipAddress: ip,
      metadata: { unlinkedProvider: provider },
    });

    return NextResponse.json({
      message: `Successfully disconnected ${provider} account.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}
