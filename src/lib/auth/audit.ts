import { prisma } from "@/lib/prisma";

export interface LogLoginParams {
  userId?: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  status: "SUCCESS" | "FAILED";
  failureReason?: string;
}

export async function logLoginEvent(params: LogLoginParams): Promise<void> {
  try {
    await prisma.loginEvent.create({
      data: {
        userId: params.userId || null,
        email: params.email,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        status: params.status,
        failureReason: params.failureReason || null,
      },
    });
  } catch (error) {
    console.error("Failed to log login event:", (error as Error).message);
  }
}

export interface LogSecurityParams {
  userId?: string;
  eventType:
    | "PASSWORD_CHANGED"
    | "PASSWORD_RESET_REQUESTED"
    | "EMAIL_VERIFIED"
    | "OAUTH_LINKED"
    | "OAUTH_UNLINKED"
    | "ROLE_GRANTED"
    | "ROLE_REVOKED"
    | "SESSION_REVOKED"
    | "ALL_SESSIONS_REVOKED"
    | "VERIFICATION_SUBMITTED"
    | "VERIFICATION_APPROVED"
    | "VERIFICATION_REJECTED"
    | "ACCOUNT_SUSPENDED"
    | "ACCOUNT_DELETED";
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export async function logSecurityEvent(params: LogSecurityParams): Promise<void> {
  try {
    // Sanitize metadata to prevent leaking sensitive fields
    const sanitizedMetadata = params.metadata ? { ...params.metadata } : {};
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.passwordHash;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.secret;

    await prisma.securityEvent.create({
      data: {
        userId: params.userId || null,
        eventType: params.eventType,
        ipAddress: params.ipAddress || null,
        metadata: sanitizedMetadata,
      },
    });
  } catch (error) {
    console.error("Failed to log security event:", (error as Error).message);
  }
}
