import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTotpCode } from "@/lib/auth/totp";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const disableSchema = z.object({
  password: z.string().optional(),
  code: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const session = await requireAuth();
    const body = await req.json();
    const parseResult = disableSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { password, code } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Must verify with password or current TOTP code
    let verified = false;

    if (password && user.passwordHash) {
      verified = await verifyPassword(password, user.passwordHash);
    } else if (code && user.twoFactorSecret) {
      verified = verifyTotpCode(user.twoFactorSecret, code);
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Incorrect password or verification code." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "2FA_DISABLED",
      ipAddress: ip,
      metadata: { method: "MANUAL" },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication disabled.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to disable 2FA." },
      { status: 500 }
    );
  }
}
