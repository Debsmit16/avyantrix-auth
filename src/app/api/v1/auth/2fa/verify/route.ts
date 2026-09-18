import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verify2faToken } from "@/lib/auth/jwt";
import { verifyTotpCode, verifyAndConsumeBackupCode } from "@/lib/auth/totp";
import { createSession } from "@/lib/auth/session";
import { logLoginEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const verifySchema = z.object({
  tempToken: z.string().min(10),
  code: z.string().min(6).max(12),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const body = await req.json();
    const parseResult = verifySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit code or backup recovery code." },
        { status: 400 }
      );
    }

    const { tempToken, code } = parseResult.data;

    // Verify short-lived 2FA challenge token
    let decodedSub: string;
    try {
      const decoded = verify2faToken(tempToken);
      decodedSub = decoded.sub;
    } catch (e) {
      return NextResponse.json(
        { error: "2FA session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedSub },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE" || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Invalid user or 2FA is not configured." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    let verified = false;
    let usedBackupCode = false;
    let updatedBackupCodes = user.twoFactorBackupCodes;

    // 1. Check TOTP 6-digit code
    if (/^\d{6}$/.test(cleanCode)) {
      verified = verifyTotpCode(user.twoFactorSecret, cleanCode);
    }

    // 2. If not verified and format could be backup code, check backup codes
    if (!verified && user.twoFactorBackupCodes.length > 0) {
      const backupCheck = verifyAndConsumeBackupCode(cleanCode, user.twoFactorBackupCodes);
      if (backupCheck.valid) {
        verified = true;
        usedBackupCode = true;
        updatedBackupCodes = backupCheck.remainingHashedCodes;
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid authenticator code or backup recovery code." },
        { status: 400 }
      );
    }

    // If backup code was used, burn it in the database
    if (usedBackupCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: updatedBackupCodes },
      });
    }

    // Create session and set HttpOnly session cookie
    await createSession({
      userId: user.id,
      ipAddress: ip,
      userAgent,
      deviceInfo: userAgent.substring(0, 100),
    });

    await logLoginEvent({
      userId: user.id,
      email: user.email,
      ipAddress: ip,
      userAgent,
      status: "SUCCESS",
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissionsSet.add(rp.permission.name);
      });
    });

    return NextResponse.json({
      success: true,
      message: "Authentication successful.",
      usedBackupCode,
      remainingBackupCodesCount: updatedBackupCodes.length,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        username: user.profile?.username,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        avatarUrl: user.profile?.avatarUrl,
        roles,
        permissions: Array.from(permissionsSet),
      },
    });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Verification failed." },
      { status: 500 }
    );
  }
}
