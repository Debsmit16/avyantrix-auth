import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";
import { signIdToken, signAccessToken, verifyJwt } from "./jwt";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";

/**
 * SHA-256 hash helper for authorization codes and token indexing.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface CreateAuthCodeParams {
  clientId: string;
  userId: string;
  redirectUri: string;
  scope?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  nonce?: string;
}

/**
 * Issue a single-use, short-lived (5-minute TTL) Authorization Code for SSO.
 * PKCE method must be 'S256' (RFC 7636).
 */
export async function createAuthorizationCode({
  clientId,
  userId,
  redirectUri,
  scope = "openid profile email",
  codeChallenge,
  codeChallengeMethod,
}: CreateAuthCodeParams): Promise<string> {
  // Validate registered OAuth client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    throw new Error("Invalid OAuth client_id");
  }

  // Validate redirect URI against registered client whitelist
  const isAllowedUri = client.redirectUris.some((uri) =>
    redirectUri.startsWith(uri) || redirectUri === uri
  );

  if (!isAllowedUri) {
    throw new Error("Unauthorized redirect_uri for this client");
  }

  // Enforce mandatory S256 for PKCE
  if (codeChallenge) {
    if (codeChallengeMethod && codeChallengeMethod !== "S256") {
      throw new Error("Unsupported code_challenge_method. Only 'S256' is permitted.");
    }
  }

  // 256-bit random authorization code
  const rawCode = crypto.randomBytes(32).toString("hex");
  const codeHash = hashToken(rawCode);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.authorizationCode.create({
    data: {
      codeHash,
      clientId,
      userId,
      redirectUri,
      scope,
      codeChallenge,
      codeChallengeMethod: codeChallenge ? "S256" : null,
      expiresAt,
    },
  });

  return rawCode;
}

export interface ExchangeCodeParams {
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}

/**
 * Exchange an authorization code for OpenID Connect ID Token (JWT), Access Token & Rotated Refresh Token.
 */
export async function exchangeAuthorizationCode({
  clientId,
  clientSecret,
  code,
  redirectUri,
  codeVerifier,
}: ExchangeCodeParams) {
  // 1. Validate Client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    throw new Error("Invalid client credentials");
  }

  // If confidential client has a secret, verify it with Argon2id
  if (client.clientSecretHash) {
    if (!clientSecret) {
      throw new Error("Missing client_secret for confidential client");
    }
    const validSecret = await verifyPassword(clientSecret, client.clientSecretHash);
    if (!validSecret) {
      throw new Error("Invalid client_secret");
    }
  }

  // 2. Lookup and atomically burn authorization code
  const codeHash = hashToken(code);
  const authCode = await prisma.authorizationCode.findUnique({
    where: { codeHash },
  });

  if (!authCode) {
    throw new Error("Invalid or expired authorization code");
  }

  if (authCode.usedAt !== null) {
    throw new Error("Authorization code has already been consumed");
  }

  if (authCode.expiresAt < new Date()) {
    throw new Error("Authorization code has expired");
  }

  if (authCode.clientId !== clientId) {
    throw new Error("Authorization code was not issued to this client");
  }

  if (authCode.redirectUri !== redirectUri) {
    throw new Error("Mismatch in redirect_uri");
  }

  // 3. Verify PKCE strictly via S256 (RFC 7636)
  if (authCode.codeChallenge) {
    if (!codeVerifier) {
      throw new Error("PKCE code_verifier is required");
    }
    const computedChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    if (computedChallenge !== authCode.codeChallenge) {
      throw new Error("Invalid PKCE code_verifier");
    }
  }

  // Atomically mark code as used
  await prisma.authorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() },
  });

  // 4. Fetch authoritative user claims from Neon PostgreSQL
  const user = await prisma.user.findUnique({
    where: { id: authCode.userId },
    include: {
      profile: true,
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      verificationBadges: {
        where: { isActive: true },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("User account is inactive or disabled");
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name)
      )
    )
  );

  const issuer = process.env.APP_URL || "https://auth.avyantrix.com";
  const now = Math.floor(Date.now() / 1000);
  const tokenExpiresIn = 3600; // 1 hour

  // 5. Build and sign standard OIDC ID Token (JWT)
  const idToken = signIdToken({
    iss: issuer,
    sub: user.id,
    aud: clientId,
    exp: now + tokenExpiresIn,
    iat: now,
    auth_time: now,
    email: user.email,
    email_verified: user.emailVerified,
    preferred_username: user.profile?.username || "",
    name: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
    given_name: user.profile?.firstName || "",
    family_name: user.profile?.lastName || "",
    picture: user.profile?.avatarUrl || null,
    roles,
    permissions,
    badges: user.verificationBadges.map((b) => ({
      category: b.category,
      badgeLabel: b.badgeLabel,
      issuedAt: b.issuedAt.toISOString(),
    })),
  });

  // 6. Build and sign standard OAuth 2.0 Bearer Access Token (JWT)
  const accessToken = signAccessToken({
    iss: issuer,
    sub: user.id,
    aud: clientId,
    scope: authCode.scope,
    exp: now + tokenExpiresIn,
    iat: now,
    jti: crypto.randomBytes(16).toString("hex"),
  });

  // 7. Issue 30-Day Rotated Refresh Token
  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenHash = hashToken(rawRefreshToken);
  const familyId = crypto.randomUUID();
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      clientId,
      userId: user.id,
      scope: authCode.scope,
      familyId,
      expiresAt: refreshExpiresAt,
    },
  });

  dispatchWebhookEvent("oauth.token.issued", {
    clientId,
    userId: user.id,
    scope: authCode.scope,
    grantType: "authorization_code",
  }).catch(() => {});

  return {
    access_token: accessToken,
    token_type: "Bearer",
    id_token: idToken,
    refresh_token: rawRefreshToken,
    expires_in: tokenExpiresIn,
    scope: authCode.scope,
  };
}

export interface RefreshTokenParams {
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
}

/**
 * Exchange a Refresh Token for a new Access Token and newly rotated Refresh Token.
 * Implements Token Family Replay Detection (RFC 6749 / OAuth 2.1).
 */
export async function refreshAccessToken({
  clientId,
  clientSecret,
  refreshToken,
}: RefreshTokenParams) {
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    throw new Error("Invalid client credentials");
  }

  if (client.clientSecretHash) {
    if (!clientSecret) {
      throw new Error("Missing client_secret");
    }
    const validSecret = await verifyPassword(clientSecret, client.clientSecretHash);
    if (!validSecret) {
      throw new Error("Invalid client_secret");
    }
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await prisma.oAuthRefreshToken.findUnique({
    where: { tokenHash },
  });

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  // Token Reuse Detection: If an already-revoked token is presented, revoke the entire family!
  if (storedToken.isRevoked) {
    await prisma.oAuthRefreshToken.updateMany({
      where: { familyId: storedToken.familyId },
      data: { isRevoked: true },
    });
    throw new Error("Refresh token reuse detected. Token family revoked for security.");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error("Refresh token has expired");
  }

  if (storedToken.clientId !== clientId) {
    throw new Error("Refresh token was not issued to this client");
  }

  // Atomically revoke the consumed token
  await prisma.oAuthRefreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true },
  });

  // Fetch user claims
  const user = await prisma.user.findUnique({
    where: { id: storedToken.userId },
    include: {
      profile: true,
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      verificationBadges: {
        where: { isActive: true },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("User account is inactive or disabled");
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name)
      )
    )
  );

  const issuer = process.env.APP_URL || "https://auth.avyantrix.com";
  const now = Math.floor(Date.now() / 1000);
  const tokenExpiresIn = 3600; // 1 hour

  const idToken = signIdToken({
    iss: issuer,
    sub: user.id,
    aud: clientId,
    exp: now + tokenExpiresIn,
    iat: now,
    auth_time: now,
    email: user.email,
    email_verified: user.emailVerified,
    preferred_username: user.profile?.username || "",
    name: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
    given_name: user.profile?.firstName || "",
    family_name: user.profile?.lastName || "",
    picture: user.profile?.avatarUrl || null,
    roles,
    permissions,
    badges: user.verificationBadges.map((b) => ({
      category: b.category,
      badgeLabel: b.badgeLabel,
      issuedAt: b.issuedAt.toISOString(),
    })),
  });

  const accessToken = signAccessToken({
    iss: issuer,
    sub: user.id,
    aud: clientId,
    scope: storedToken.scope,
    exp: now + tokenExpiresIn,
    iat: now,
    jti: crypto.randomBytes(16).toString("hex"),
  });

  // Rotate to next generation in same token family
  const nextRawRefreshToken = crypto.randomBytes(40).toString("hex");
  const nextTokenHash = hashToken(nextRawRefreshToken);
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash: nextTokenHash,
      clientId,
      userId: user.id,
      scope: storedToken.scope,
      familyId: storedToken.familyId,
      expiresAt: refreshExpiresAt,
    },
  });

  dispatchWebhookEvent("oauth.token.issued", {
    clientId,
    userId: user.id,
    scope: storedToken.scope,
    grantType: "refresh_token",
  }).catch(() => {});

  return {
    access_token: accessToken,
    token_type: "Bearer",
    id_token: idToken,
    refresh_token: nextRawRefreshToken,
    expires_in: tokenExpiresIn,
    scope: storedToken.scope,
  };
}

/**
 * Resolve user profile for OIDC UserInfo endpoint from an active Access Token.
 */
export async function getUserInfoFromBearerToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  const decoded = verifyJwt<{ sub: string; aud: string; scope: string }>(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    include: {
      profile: true,
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      verificationBadges: {
        where: { isActive: true },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("User account is inactive or disabled");
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name)
      )
    )
  );

  return {
    sub: user.id,
    email: user.email,
    email_verified: user.emailVerified,
    preferred_username: user.profile?.username || "",
    name: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
    given_name: user.profile?.firstName || "",
    family_name: user.profile?.lastName || "",
    picture: user.profile?.avatarUrl || null,
    headline: user.profile?.headline || null,
    roles,
    permissions,
    badges: user.verificationBadges.map((b) => ({
      category: b.category,
      badgeLabel: b.badgeLabel,
      issuedAt: b.issuedAt,
    })),
  };
}
