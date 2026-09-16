import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "avy_auth_session";
export const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE_SECONDS || "2592000", 10); // 30 days

/**
 * Hash a raw session token with SHA-256 for secure database lookup.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface CreateSessionParams {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
}

export interface ActiveSession {
  id: string;
  userId: string;
  email: string;
  emailVerified: boolean;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
  roles: string[];
  permissions: string[];
}

/**
 * Create a new authoritative session in PostgreSQL and set the HttpOnly cookie.
 */
export async function createSession({
  userId,
  ipAddress,
  userAgent,
  deviceInfo,
}: CreateSessionParams): Promise<{ rawToken: string; session: any }> {
  // 1. Generate 256-bit cryptographically secure token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  // 2. Persist to authoritative PostgreSQL sessions table
  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken: tokenHash,
      ipAddress,
      userAgent,
      deviceInfo,
      expiresAt,
    },
  });

  // 3. Dispatch secure cookie
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return { rawToken, session };
}

/**
 * Retrieve and validate the active session from PostgreSQL.
 */
export async function getSession(): Promise<ActiveSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  // Authoritative PostgreSQL lookup with relations
  const session = await prisma.session.findUnique({
    where: { sessionToken: tokenHash },
    include: {
      user: {
        include: {
          profile: true,
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  // Check expiration
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Check user status
  if (session.user.status === "SUSPENDED" || session.user.status === "DELETED") {
    return null;
  }

  // Sliding window update for active sessions (every 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (session.lastActiveAt < oneHourAgo) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});
  }

  // Extract roles and distinct permissions
  const roles = session.user.userRoles.map((ur) => ur.role.name);
  const permissionsSet = new Set<string>();
  session.user.userRoles.forEach((ur) => {
    ur.role.permissions.forEach((rp) => {
      permissionsSet.add(rp.permission.name);
    });
  });

  return {
    id: session.id,
    userId: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    username: session.user.profile?.username || "",
    firstName: session.user.profile?.firstName || "",
    lastName: session.user.profile?.lastName || "",
    avatarUrl: session.user.profile?.avatarUrl || null,
    status: session.user.status,
    roles,
    permissions: Array.from(permissionsSet),
  };
}

/**
 * Revoke the current active session in PostgreSQL and clear cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    await prisma.session.delete({ where: { sessionToken: tokenHash } }).catch(() => {});
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Revoke ALL active sessions for a user (Logout everywhere).
 */
export async function destroyAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { userId },
  });

  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return result.count;
}

/**
 * Revoke a specific session by ID (e.g. from security management dashboard).
 */
export async function destroySessionById(sessionId: string, userId: string): Promise<boolean> {
  const deleted = await prisma.session.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  });

  return deleted.count > 0;
}
