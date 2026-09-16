import * as argon2 from "argon2";

/**
 * Common weak / trivial passwords list to reject.
 */
const COMMON_WEAK_PASSWORDS = new Set([
  "password1234",
  "123456789012",
  "administrator",
  "correcthorsebatterystaple",
  "changeme1234",
  "welcome12345",
  "avyantrix1234",
]);

/**
 * Hash a password using Argon2id exclusively (OWASP RFC 9106 recommended).
 * Configured with memoryCost: 64MB, timeCost: 3, parallelism: 1, hashLength: 32.
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 1,    // 1 lane (serverless friendly)
    hashLength: 32,    // 256-bit output hash
  });
}

/**
 * Verify a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

/**
 * Validate modernized password strength & passphrases:
 * - Minimum: 12 characters
 * - Maximum: 128 characters
 * - Allows arbitrary passphrases without forced character-class requirements
 * - Rejects known / common trivial passwords
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 12) {
    return { valid: false, error: "Password must be at least 12 characters long (passphrases recommended)." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password cannot exceed 128 characters." };
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase().trim())) {
    return { valid: false, error: "This password is too common or easily guessable. Please choose a unique passphrase." };
  }
  return { valid: true };
}
