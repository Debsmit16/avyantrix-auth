import { getSession, ActiveSession } from "@/lib/auth/session";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Ensures user is authenticated. Returns active session or throws AuthError.
 */
export async function requireAuth(): Promise<ActiveSession> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Authentication required. Please sign in.", 401);
  }
  return session;
}

/**
 * Ensures user has a specific permission.
 */
export async function requirePermission(permissionName: string): Promise<ActiveSession> {
  const session = await requireAuth();
  if (!session.permissions.includes(permissionName) && !session.roles.includes("ADMIN")) {
    throw new AuthError(`Forbidden. Missing required permission: ${permissionName}`, 403);
  }
  return session;
}

/**
 * Ensures user has at least one of the specified roles.
 */
export async function requireRole(allowedRoles: string[]): Promise<ActiveSession> {
  const session = await requireAuth();
  const hasRole = session.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole && !session.roles.includes("ADMIN")) {
    throw new AuthError(`Forbidden. Access restricted to roles: ${allowedRoles.join(", ")}`, 403);
  }
  return session;
}

/**
 * Check if a session has a given permission without throwing.
 */
export function hasPermission(session: ActiveSession | null, permission: string): boolean {
  if (!session) return false;
  if (session.roles.includes("ADMIN")) return true;
  return session.permissions.includes(permission);
}
