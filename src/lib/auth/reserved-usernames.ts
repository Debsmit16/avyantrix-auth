/**
 * Reserved Username Blacklist
 * Prevents route collisions, impersonation of system services, and security ambiguities.
 */

export const RESERVED_USERNAMES = new Set([
  // Core System & Role Impersonation
  "admin",
  "administrator",
  "root",
  "superuser",
  "system",
  "staff",
  "moderator",
  "mod",
  "support",
  "security",
  "help",
  "billing",
  "finance",
  "ops",
  "devops",
  "compliance",
  "official",
  "team",
  "bot",
  "avyantrix",
  "avyantrix-team",
  "avyantrix-admin",

  // Authentication & Identity Endpoints
  "auth",
  "login",
  "signin",
  "signup",
  "register",
  "logout",
  "oauth",
  "sso",
  "session",
  "verify",
  "verification",
  "2fa",
  "totp",
  "magic-login",
  "magic-link",
  "recovery",
  "reset",
  "password",
  "mfa",
  "token",
  "authorize",
  "userinfo",

  // Application Routes & Pages
  "api",
  "dashboard",
  "settings",
  "profile",
  "explore",
  "leaderboard",
  "docs",
  "documentation",
  "blog",
  "status",
  "health",
  "webhook",
  "webhooks",
  "cron",
  "admin-panel",
  "apps",
  "builds",
  "challenges",
  "store",
  "feed",
  "notifications",
  "u",
  "user",
  "users",

  // Network, Protocol & Server Conventions
  "localhost",
  "test",
  "staging",
  "demo",
  "mail",
  "email",
  "smtp",
  "imap",
  "pop",
  "ftp",
  "ssh",
  "ssl",
  "ns1",
  "ns2",
  "mx",
  "www",
  "http",
  "https",
  "well-known",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "null",
  "undefined",
  "anon",
  "anonymous",
  "void",
  "everyone",
]);

/**
 * Check if a username is in the reserved blacklist.
 */
export function isReservedUsername(username: string): boolean {
  if (!username) return true;
  const normalized = username.trim().toLowerCase();
  return RESERVED_USERNAMES.has(normalized);
}

/**
 * Validate a candidate username for format, length, and reserved collisions.
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== "string") {
    return { valid: false, error: "Username is required" };
  }

  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters long" };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: "Username must not exceed 30 characters" };
  }

  const validCharsRegex = /^[a-z0-9_]+$/;
  if (!validCharsRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Username may only contain letters, numbers, and underscores (_)",
    };
  }

  if (isReservedUsername(trimmed)) {
    return {
      valid: false,
      error: `Username '${trimmed}' is reserved by the system and cannot be claimed`,
    };
  }

  return { valid: true };
}
