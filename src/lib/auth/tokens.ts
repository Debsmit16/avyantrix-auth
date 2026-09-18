import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  // Invalidate any existing unused email verification tokens for this user
  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type: "EMAIL_VERIFICATION",
    },
  });

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash,
      type: "EMAIL_VERIFICATION",
      expiresAt,
    },
  });

  return rawToken;
}

export async function verifyEmailToken(rawToken: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  const tokenHash = hashToken(rawToken);

  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      tokenHash,
      type: "EMAIL_VERIFICATION",
    },
  });

  if (!tokenRecord) {
    return { success: false, error: "Invalid or non-existent verification token." };
  }

  if (tokenRecord.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
    return { success: false, error: "Verification link has expired. Please request a new one." };
  }

  if (tokenRecord.usedAt) {
    return { success: false, error: "Verification link has already been used." };
  }

  // Atomic mark user as verified and delete token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true },
    }),
    prisma.verificationToken.delete({
      where: { id: tokenRecord.id },
    }),
  ]);

  return { success: true, userId: tokenRecord.userId };
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  // Invalidate prior unused password reset tokens
  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type: "PASSWORD_RESET",
    },
  });

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash,
      type: "PASSWORD_RESET",
      expiresAt,
    },
  });

  return rawToken;
}

export async function verifyPasswordResetToken(rawToken: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  const tokenHash = hashToken(rawToken);

  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      tokenHash,
      type: "PASSWORD_RESET",
    },
  });

  if (!tokenRecord) {
    return { success: false, error: "Invalid or expired password reset link." };
  }

  if (tokenRecord.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
    return { success: false, error: "Password reset link has expired. Please request a new one." };
  }

  if (tokenRecord.usedAt) {
    return { success: false, error: "Password reset link has already been used." };
  }

  return { success: true, userId: tokenRecord.userId };
}

export async function consumePasswordResetToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.verificationToken.deleteMany({
    where: {
      tokenHash,
      type: "PASSWORD_RESET",
    },
  });
}

/**
 * Create a single-use, 15-minute TTL magic login token.
 */
export async function createMagicLoginToken(userId: string): Promise<string> {
  // Invalidate any active magic login tokens for this user
  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type: "MAGIC_LOGIN",
    },
  });

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash,
      type: "MAGIC_LOGIN",
      expiresAt,
    },
  });

  return rawToken;
}

/**
 * Verify and atomically consume a magic login token.
 */
export async function verifyMagicLoginToken(rawToken: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  const tokenHash = hashToken(rawToken);

  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      tokenHash,
      type: "MAGIC_LOGIN",
    },
  });

  if (!tokenRecord) {
    return { success: false, error: "Invalid or non-existent magic login link." };
  }

  if (tokenRecord.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
    return { success: false, error: "Magic login link has expired. Please request a new one." };
  }

  if (tokenRecord.usedAt) {
    return { success: false, error: "Magic login link has already been used." };
  }

  // Atomically delete token to prevent replay
  await prisma.verificationToken.delete({
    where: { id: tokenRecord.id },
  });

  return { success: true, userId: tokenRecord.userId };
}

