import { hash, verify, Algorithm, Version } from "@node-rs/argon2";

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
 * Configured with memoryCost: 64MB (65536 KB), timeCost: 3, parallelism: 1, outputLen: 32.
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    algorithm: Algorithm.Argon2id,
    version: Version.V0x13,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
    outputLen: 32,
  });
}

/**
 * Verify a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(password: string, hashString: string): Promise<boolean> {
  try {
    return await verify(hashString, password, {
      algorithm: Algorithm.Argon2id,
      version: Version.V0x13,
    });
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
