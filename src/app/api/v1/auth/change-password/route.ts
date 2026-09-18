import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";
import { sendSecurityAlertEmail } from "@/lib/mail/mailer";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(12, "Password must be at least 12 characters."),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const session = await requireAuth();
    const body = await req.json();
    const parseResult = changePasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // If user already has a password, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required." },
          { status: 400 }
        );
      }
      const isMatch = await verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Incorrect current password." },
          { status: 400 }
        );
      }
    }

    // Validate new password complexity
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Send security notification
    await sendSecurityAlertEmail(
      user.email,
      user.profile?.firstName || "Builder",
      "Password Updated",
      "The password for your Avyantrix ID was successfully updated from your security settings."
    );

    await logSecurityEvent({
      userId: user.id,
      eventType: "PASSWORD_CHANGED",
      ipAddress: ip,
      metadata: { action: "password_changed_settings" },
    });

    return NextResponse.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Change password error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update password." },
      { status: 500 }
    );
  }
}
