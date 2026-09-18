import crypto from "crypto";

const JWT_SECRET =
  process.env.OIDC_JWT_SECRET ||
  process.env.SESSION_SECRET ||
  "avyantrix-oidc-root-secret-key-32-bytes-long!";

/**
 * Base64URL encode a buffer or string.
 */
function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Base64URL decode to string.
 */
function base64urlDecode(input: string): string {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export interface StandardIdTokenClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  auth_time?: number;
  nonce?: string;
  email: string;
  email_verified: boolean;
  preferred_username: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string | null;
  roles: string[];
  permissions: string[];
  badges: Array<{
    category: string;
    badgeLabel: string;
    issuedAt: string | Date;
  }>;
}

/**
 * Sign an OIDC ID Token (JWT) using HMAC-SHA256 (HS256).
 */
export function signIdToken(claims: StandardIdTokenClaims): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest();

  return `${signatureInput}.${base64url(signature)}`;
}

export interface StandardAccessTokenClaims {
  iss: string;
  sub: string;
  aud: string;
  scope: string;
  exp: number;
  iat: number;
  jti: string;
}

/**
 * Sign an OAuth 2.0 Access Token (JWT) using HMAC-SHA256 (HS256).
 */
export function signAccessToken(claims: StandardAccessTokenClaims): string {
  const header = {
    alg: "HS256",
    typ: "at+jwt",
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest();

  return `${signatureInput}.${base64url(signature)}`;
}

/**
 * Verify and parse a signed OIDC JWT.
 */
export function verifyJwt<T = any>(token: string, expectedAudience?: string): T {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT token format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest();

  if (base64url(expectedSignature) !== encodedSignature) {
    throw new Error("Invalid JWT signature");
  }

  const payload: T & { exp?: number; iss?: string; aud?: string } = JSON.parse(
    base64urlDecode(encodedPayload)
  );

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("JWT token has expired");
  }

  if (payload.iss && payload.iss !== (process.env.APP_URL || "https://auth.avyantrix.com")) {
    throw new Error(`Invalid token issuer: ${payload.iss}`);
  }

  if (expectedAudience && payload.aud && payload.aud !== expectedAudience) {
    throw new Error(`Invalid token audience: expected ${expectedAudience}, got ${payload.aud}`);
  }

  return payload;
}

/**
 * Sign a 5-minute temporary token during 2FA login challenge.
 */
export function sign2faToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "2fa+jwt" };
  const payload = {
    sub: userId,
    type: "2fa_challenge",
    exp: now + 300, // 5 minutes
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest();

  return `${signatureInput}.${base64url(signature)}`;
}

/**
 * Verify a 2FA temporary challenge token.
 */
export function verify2faToken(token: string): { sub: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest();

  if (base64url(expectedSignature) !== encodedSignature) {
    throw new Error("Invalid token signature.");
  }

  const payload: { sub: string; type: string; exp: number } = JSON.parse(
    base64urlDecode(encodedPayload)
  );

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error("2FA challenge token has expired. Please try signing in again.");
  }

  if (payload.type !== "2fa_challenge") {
    throw new Error("Invalid token type.");
  }

  return { sub: payload.sub };
}

