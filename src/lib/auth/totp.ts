import crypto from "crypto";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into a Base32 string (RFC 4648).
 */
export function bufferToBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
export function base32ToBuffer(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically random Base32 secret for TOTP (160 bits / 20 bytes).
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return bufferToBase32(randomBytes);
}

/**
 * Computes a 6-digit TOTP code for a given timestamp step (RFC 6238).
 */
export function generateTotpCode(secret: string, timestamp: number = Date.now()): string {
  const key = base32ToBuffer(secret);
  const timeStep = Math.floor(timestamp / 1000 / 30); // 30-second time step

  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac("sha1", key).update(timeBuffer).digest();

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0xf;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = codeInt % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP code against the secret, allowing a ±window (default 1 = ±30s clock drift).
 */
export function verifyTotpCode(secret: string, token: string, window: number = 1): boolean {
  if (!token || !/^\d{6}$/.test(token.trim())) {
    return false;
  }

  const cleanToken = token.trim();
  const now = Date.now();

  for (let i = -window; i <= window; i++) {
    const checkTime = now + i * 30 * 1000;
    const expected = generateTotpCode(secret, checkTime);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Builds the standard OTPAuth URI for QR code scanners.
 */
export function getOtpAuthUri(email: string, secret: string, issuer: string = "Avyantrix ID"): string {
  const label = `${issuer}:${email}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates 8 single-use alphanumeric backup recovery codes.
 */
export function generateBackupCodes(count: number = 8): {
  rawCodes: string[];
  hashedCodes: string[];
} {
  const rawCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 chars, e.g. "A1B2C3D4E5"
    const formattedCode = `${code.slice(0, 5)}-${code.slice(5)}`;
    rawCodes.push(formattedCode);
    const hash = crypto.createHash("sha256").update(formattedCode).digest("hex");
    hashedCodes.push(hash);
  }

  return { rawCodes, hashedCodes };
}

/**
 * Validates and consumes a single-use backup code.
 */
export function verifyAndConsumeBackupCode(
  rawInput: string,
  hashedCodes: string[]
): { valid: boolean; remainingHashedCodes: string[] } {
  const cleanInput = rawInput.trim().toUpperCase();
  const inputHash = crypto.createHash("sha256").update(cleanInput).digest("hex");

  const matchIndex = hashedCodes.findIndex((h) => h === inputHash);
  if (matchIndex === -1) {
    return { valid: false, remainingHashedCodes: hashedCodes };
  }

  const remaining = [...hashedCodes];
  remaining.splice(matchIndex, 1);
  return { valid: true, remainingHashedCodes: remaining };
}
