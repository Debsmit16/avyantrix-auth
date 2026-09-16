import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { verifyPasswordResetToken, consumePasswordResetToken } from "@/lib/auth/tokens";
import { destroyAllUserSessions } from "@/lib/auth/session";
import { sendSecurityAlertEmail } from "@/lib/mail/mailer";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resetSchema = z.object({
  token: z.string().min(1, "Token is required."),
  newPassword: z.string().min(12, "Password must be at least 12 characters."),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const body = await req.json();
    const parseResult = resetSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { token, newPassword } = parseResult.data;

    // Validate password complexity
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    // Verify token
    const tokenVerification = await verifyPasswordResetToken(token);
    if (!tokenVerification.success || !tokenVerification.userId) {
      return NextResponse.json(
        { error: tokenVerification.error || "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    const userId = tokenVerification.userId;
    const passwordHash = await hashPassword(newPassword);

    // Update password in Neon PostgreSQL
    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      include: { profile: true },
    });

    // Invalidate token
    await consumePasswordResetToken(token);

    // Invalidate all existing sessions on password change for security
    await destroyAllUserSessions(userId);

    // Send security notification
    await sendSecurityAlertEmail(
      user.email,
      user.profile?.firstName || "Builder",
      "Password Changed",
      "The password for your Avyantrix ID was recently changed. All active sessions have been signed out."
    );

    await logSecurityEvent({
      userId,
      eventType: "PASSWORD_CHANGED",
      ipAddress: ip,
      metadata: { action: "password_reset_via_token" },
    });

    return NextResponse.json({
      message: "Your password has been reset successfully. Please sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
