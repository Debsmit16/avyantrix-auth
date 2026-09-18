import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { verifyTotpCode, generateBackupCodes } from "@/lib/auth/totp";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const enableSchema = z.object({
  secret: z.string().min(16),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const session = await requireAuth();
    const body = await req.json();
    const parseResult = enableSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid 6-digit confirmation code or secret." },
        { status: 400 }
      );
    }

    const { secret, code } = parseResult.data;

    // Verify 6-digit TOTP code
    const isValid = verifyTotpCode(secret, code);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please make sure your device clock is synced." },
        { status: 400 }
      );
    }

    // Generate 8 single-use backup recovery codes
    const { rawCodes, hashedCodes } = generateBackupCodes(8);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: hashedCodes,
      },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "2FA_ENABLED",
      ipAddress: ip,
      metadata: { method: "TOTP_AUTHENTICATOR" },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled successfully.",
      backupCodes: rawCodes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to enable 2FA." },
      { status: 500 }
    );
  }
}
