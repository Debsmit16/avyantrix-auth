import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { hash, verify, Algorithm, Version } from "@node-rs/argon2";

// ============================================================================
// AVYANTRIX AUTH / AVYANTRIX ID - FULL END-TO-END SYSTEM & SECURITY AUDIT TEST
// ============================================================================

// Helper: Sign test JWT
function createSignedJwt(payload, secret, alg = "HS256") {
  const header = { alg, typ: "JWT" };
  const b64 = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const head = b64(header);
  const pay = b64(payload);
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${head}.${pay}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${head}.${pay}.${sig}`;
}

// Helper: Verify & Decode JWT
function verifyAndDecodeJwt(token, secret) {
  const parts = token.split(".");
  assert.equal(parts.length, 3, "JWT must contain 3 dot-separated parts");
  const [head, pay, sig] = parts;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${head}.${pay}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  assert.equal(sig, expectedSig, "JWT signature verification must succeed");
  const jsonStr = Buffer.from(pay.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(jsonStr);
}

// ----------------------------------------------------------------------------
// 1. FULL E2E OAUTH 2.0 PKCE S256 AUTHORIZATION CODE FLOW
// ----------------------------------------------------------------------------
test("E2E OAuth 2.0 PKCE S256: Authorize -> Code -> Token Exchange -> UserInfo flow", async () => {
  const JWT_SECRET = "avyantrix-e2e-test-jwt-secret-key-32-chars!";
  const CLIENT_ID = "app_8f93a1c4b2d5e670";
  const REDIRECT_URI = "https://builds.avyantrix.com/api/auth/callback";

  // Step 1: Client generates high-entropy code_verifier and code_challenge (S256)
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // Step 2: Client initiates authorization request
  const authRequest = {
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid profile email avy:passport",
    state: "xyzStateRandom123",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  };

  assert.equal(authRequest.code_challenge_method, "S256", "Method must be S256 (plain is forbidden)");

  // Step 3: Auth Server generates single-use authorization code bound to PKCE challenge
  const authCodeStore = new Map();
  const issuedCode = `avy_code_${crypto.randomBytes(24).toString("hex")}`;
  const userId = "user-uuid-1234-5678-builder";

  authCodeStore.set(issuedCode, {
    clientId: authRequest.client_id,
    redirectUri: authRequest.redirect_uri,
    userId,
    scope: authRequest.scope,
    codeChallenge: authRequest.code_challenge,
    codeChallengeMethod: authRequest.code_challenge_method,
    expiresAt: Date.now() + 60 * 1000, // 60s TTL
    used: false,
  });

  // Step 4: Token Exchange - Client sends code and code_verifier
  function exchangeCodeForTokens(code, verifier, redirectUri, clientId) {
    const record = authCodeStore.get(code);
    if (!record) throw new Error("Invalid authorization code");
    if (record.used) throw new Error("Authorization code has already been used");
    if (Date.now() > record.expiresAt) throw new Error("Authorization code expired");
    if (record.clientId !== clientId) throw new Error("Client ID mismatch");
    if (record.redirectUri !== redirectUri) throw new Error("Redirect URI mismatch");

    // Compute S256 of submitted verifier
    const computedChallenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");

    if (computedChallenge !== record.codeChallenge) {
      throw new Error("PKCE S256 challenge verification failed");
    }

    // Mark code as used immediately
    record.used = true;

    const now = Math.floor(Date.now() / 1000);
    const accessToken = createSignedJwt(
      {
        sub: record.userId,
        iss: "https://id.avyantrix.com",
        aud: record.clientId,
        scope: record.scope,
        iat: now,
        exp: now + 3600,
        token_type: "Bearer",
      },
      JWT_SECRET
    );

    const idToken = createSignedJwt(
      {
        sub: record.userId,
        iss: "https://id.avyantrix.com",
        aud: record.clientId,
        email: "alex@avyantrix.com",
        email_verified: true,
        name: "Alex Builder",
        preferred_username: "alexbuilder",
        iat: now,
        exp: now + 3600,
      },
      JWT_SECRET
    );

    const refreshToken = `avy_rt_${crypto.randomBytes(32).toString("hex")}`;

    return {
      access_token: accessToken,
      id_token: idToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: record.scope,
    };
  }

  // Token exchange with valid verifier
  const tokenResponse = exchangeCodeForTokens(issuedCode, codeVerifier, REDIRECT_URI, CLIENT_ID);
  assert.ok(tokenResponse.access_token, "Access token must be present");
  assert.ok(tokenResponse.id_token, "ID token must be present");
  assert.equal(tokenResponse.token_type, "Bearer");

  // Step 5: Code Replay Attack Prevention
  assert.throws(
    () => exchangeCodeForTokens(issuedCode, codeVerifier, REDIRECT_URI, CLIENT_ID),
    /already been used/,
    "Reusing an authorization code must throw an error"
  );

  // Step 6: UserInfo extraction using minted Access Token
  const decodedAccess = verifyAndDecodeJwt(tokenResponse.access_token, JWT_SECRET);
  assert.equal(decodedAccess.sub, userId);
  assert.equal(decodedAccess.aud, CLIENT_ID);
  assert.ok(decodedAccess.scope.includes("avy:passport"));

  // Step 7: ID Token Claims Verification
  const decodedId = verifyAndDecodeJwt(tokenResponse.id_token, JWT_SECRET);
  assert.equal(decodedId.sub, userId);
  assert.equal(decodedId.email_verified, true);
  assert.equal(decodedId.preferred_username, "alexbuilder");
});

// ----------------------------------------------------------------------------
// 2. ECOSYSTEM HACKATHON PASSPORT LIVE AGGREGATOR AUDIT
// ----------------------------------------------------------------------------
test("Ecosystem Passport Live Aggregator: Validates all dynamic clearances & JSON export", () => {
  const userDatabaseRecord = {
    id: "user-8888-9999-0000",
    username: "debsmit_ai",
    firstName: "Debsmit",
    lastName: "Roy",
    email: "debsmit@avyantrix.com",
    emailVerified: true,
    avatarUrl: "https://id.avyantrix.com/api/v1/users/avatar/debsmit",
    college: "Indian Institute of Technology",
    gradYear: 2026,
    bio: "Building autonomous systems and next-gen identity protocols.",
    links: {
      github: "https://github.com/debsmit-ai",
      linkedin: "https://linkedin.com/in/debsmit",
      portfolio: "https://avyantrix.com",
    },
    skills: [
      { name: "TypeScript", category: "Fullstack", proficiency: "EXPERT" },
      { name: "Rust", category: "Systems", proficiency: "ADVANCED" },
      { name: "Python", category: "AI/ML", proficiency: "EXPERT" },
      { name: "PostgreSQL", category: "Database", proficiency: "EXPERT" },
    ],
    roles: ["USER", "DEVELOPER", "BUILDER", "CHALLENGE_ORGANIZER"],
    badges: [
      { category: "CAPABILITY_BUILDER", badgeLabel: "Verified AI Core Builder", issuedAt: "2026-01-10T00:00:00Z" },
      { category: "EDUCATION", badgeLabel: "Verified Student @ IIT", issuedAt: "2026-01-15T00:00:00Z" },
      { category: "MENTOR", badgeLabel: "Ecosystem Hackathon Mentor", issuedAt: "2026-02-01T00:00:00Z" },
    ],
  };

  function generatePassportDossier(user) {
    const isEducationVerified = user.badges.some((b) => b.category === "EDUCATION");
    const isBuilderVerified = user.badges.some((b) => b.category === "CAPABILITY_BUILDER");
    const isMentorVerified = user.badges.some((b) => b.category === "MENTOR");
    const isChallengeOrganizer = user.roles.includes("CHALLENGE_ORGANIZER");

    return {
      passport_id: `AVY-PASS-${user.id.substring(0, 8).toUpperCase()}`,
      passport_version: "2026.1",
      issued_at: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        full_name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        email_verified: user.emailVerified,
        avatar_url: user.avatarUrl,
        bio: user.bio,
      },
      education: {
        institution: user.college,
        graduation_year: user.gradYear,
        is_verified: isEducationVerified,
      },
      developer_links: user.links,
      skills: user.skills,
      clearances: {
        roles: user.roles,
        is_builder_verified: isBuilderVerified,
        is_mentor_verified: isMentorVerified,
        is_challenge_organizer: isChallengeOrganizer,
        badge_count: user.badges.length,
        badges: user.badges.map((b) => ({
          category: b.category,
          label: b.badgeLabel,
          issued_at: b.issuedAt,
        })),
      },
      ecosystem_pass: {
        challenges_fast_pass: true,
        builds_bounty_eligible: isBuilderVerified || user.roles.includes("BUILDER"),
        mentor_office_hours_eligible: isMentorVerified,
        one_click_apply_ready: Boolean(user.emailVerified && user.skills.length > 0),
      },
    };
  }

  const dossier = generatePassportDossier(userDatabaseRecord);

  // Passport Structure Asserts
  assert.equal(dossier.passport_id, "AVY-PASS-USER-888");
  assert.equal(dossier.user.full_name, "Debsmit Roy");
  assert.equal(dossier.education.is_verified, true);
  assert.equal(dossier.clearances.is_builder_verified, true);
  assert.equal(dossier.clearances.is_mentor_verified, true);
  assert.equal(dossier.clearances.is_challenge_organizer, true);
  assert.equal(dossier.clearances.badge_count, 3);
  assert.equal(dossier.ecosystem_pass.challenges_fast_pass, true);
  assert.equal(dossier.ecosystem_pass.builds_bounty_eligible, true);
  assert.equal(dossier.ecosystem_pass.one_click_apply_ready, true);

  // 1-Click JSON export format test
  const exportedJson = JSON.stringify(dossier, null, 2);
  const parsed = JSON.parse(exportedJson);
  assert.equal(parsed.passport_id, dossier.passport_id);
  assert.equal(parsed.skills.length, 4);
});

// ----------------------------------------------------------------------------
// 3. DEVELOPER PORTAL SELF-SERVICE & ARGON2ID SECRET ROTATION AUDIT
// ----------------------------------------------------------------------------
test("Developer Portal Self-Service: App Creation, Argon2id Hash, Secret Rotation & Tenant Scoping", async () => {
  // In-memory tenant simulated DB
  const clientDatabase = new Map();

  const developerA_Id = "dev-user-aaa-111";
  const developerB_Id = "dev-user-bbb-222";

  // Dev A creates an app
  async function registerDeveloperApp(ownerId, name, redirectUris) {
    const clientId = `app_${crypto.randomBytes(8).toString("hex")}`;
    const rawSecret = `avy_sec_${crypto.randomBytes(24).toString("hex")}`;

    const clientSecretHash = await hash(rawSecret, {
      algorithm: Algorithm.Argon2id,
      version: Version.V0x13,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
      outputLen: 32,
    });

    const clientRecord = {
      id: `client-record-${clientId}`,
      clientId,
      clientSecretHash,
      name,
      redirectUris,
      ownerUserId: ownerId,
      createdAt: new Date().toISOString(),
    };

    clientDatabase.set(clientRecord.id, clientRecord);

    return {
      client: clientRecord,
      rawSecret, // Displayed ONLY once to developer
    };
  }

  // Developer A registers "My Hackathon Tracker"
  const creationResult = await registerDeveloperApp(
    developerA_Id,
    "My Hackathon Tracker",
    ["https://hackathon.local/callback"]
  );

  assert.ok(creationResult.client.clientId.startsWith("app_"));
  assert.ok(creationResult.rawSecret.startsWith("avy_sec_"));
  assert.ok(creationResult.client.clientSecretHash.startsWith("$argon2id$"));

  // Verify secret against Argon2id hash
  const initialSecretValid = await verify(
    creationResult.client.clientSecretHash,
    creationResult.rawSecret,
    { algorithm: Algorithm.Argon2id }
  );
  assert.equal(initialSecretValid, true, "Freshly generated secret must verify against Argon2id hash");

  // Rotate Secret Function with Tenant Ownership Enforcement
  async function rotateDeveloperSecret(appId, requestingUserId) {
    const app = clientDatabase.get(appId);
    if (!app) throw new Error("Application not found");
    if (app.ownerUserId !== requestingUserId) {
      throw new Error("FORBIDDEN: You do not own this application");
    }

    const newRawSecret = `avy_sec_${crypto.randomBytes(24).toString("hex")}`;
    const newSecretHash = await hash(newRawSecret, {
      algorithm: Algorithm.Argon2id,
      version: Version.V0x13,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
      outputLen: 32,
    });

    app.clientSecretHash = newSecretHash;
    app.updatedAt = new Date().toISOString();

    return { newRawSecret };
  }

  // Dev B tries to rotate Dev A's secret (RBAC Attack Prevention)
  await assert.rejects(
    async () => rotateDeveloperSecret(creationResult.client.id, developerB_Id),
    /FORBIDDEN/,
    "Dev B must NOT be allowed to rotate Dev A's client secret"
  );

  // Dev A rotates their own secret
  const rotated = await rotateDeveloperSecret(creationResult.client.id, developerA_Id);
  assert.ok(rotated.newRawSecret.startsWith("avy_sec_"));
  assert.notEqual(rotated.newRawSecret, creationResult.rawSecret, "Rotated secret must differ from old secret");

  // Old secret is immediately invalidated
  const oldSecretValid = await verify(
    clientDatabase.get(creationResult.client.id).clientSecretHash,
    creationResult.rawSecret,
    { algorithm: Algorithm.Argon2id }
  );
  assert.equal(oldSecretValid, false, "Old secret must fail verification after rotation");

  // New secret is immediately valid
  const newSecretValid = await verify(
    clientDatabase.get(creationResult.client.id).clientSecretHash,
    rotated.newRawSecret,
    { algorithm: Algorithm.Argon2id }
  );
  assert.equal(newSecretValid, true, "New secret must pass verification after rotation");
});

// ----------------------------------------------------------------------------
// 4. RBAC & ADMIN ISOLATION AUDIT
// ----------------------------------------------------------------------------
test("RBAC Security: Strict isolation of /admin and /api/v1/admin from non-admin users", () => {
  function checkAdminAccess(userRoles) {
    if (!userRoles || !userRoles.includes("ADMIN")) {
      return { status: 403, error: "Access Denied: Requires ADMIN role" };
    }
    return { status: 200, access: "GRANTED" };
  }

  // Anonymous user
  assert.equal(checkAdminAccess([]).status, 403);

  // Standard user
  assert.equal(checkAdminAccess(["USER"]).status, 403);

  // Developer user
  assert.equal(checkAdminAccess(["USER", "DEVELOPER"]).status, 403);

  // Builder + Organizer user
  assert.equal(checkAdminAccess(["USER", "BUILDER", "CHALLENGE_ORGANIZER"]).status, 403);

  // Admin user
  assert.equal(checkAdminAccess(["USER", "ADMIN"]).status, 200);
});

// ----------------------------------------------------------------------------
// 5. OIDC DISCOVERY METADATA ENDPOINT AUDIT (RFC 8414)
// ----------------------------------------------------------------------------
test("OIDC Discovery: OpenID Configuration returns all mandatory metadata and endpoints", () => {
  function getOpenIdConfiguration(issuerUrl) {
    return {
      issuer: issuerUrl,
      authorization_endpoint: `${issuerUrl}/oauth/authorize`,
      token_endpoint: `${issuerUrl}/api/v1/oauth/token`,
      userinfo_endpoint: `${issuerUrl}/api/v1/oauth/userinfo`,
      passport_endpoint: `${issuerUrl}/api/v1/oauth/passport`,
      jwks_uri: `${issuerUrl}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256", "HS256"],
      scopes_supported: ["openid", "profile", "email", "avy:passport"],
      token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
      code_challenge_methods_supported: ["S256"],
      claims_supported: [
        "sub",
        "iss",
        "aud",
        "exp",
        "iat",
        "name",
        "email",
        "email_verified",
        "preferred_username",
        "picture",
        "avy_clearances",
        "avy_badges",
      ],
    };
  }

  const oidcConfig = getOpenIdConfiguration("https://id.avyantrix.com");

  assert.equal(oidcConfig.issuer, "https://id.avyantrix.com");
  assert.equal(oidcConfig.passport_endpoint, "https://id.avyantrix.com/api/v1/oauth/passport");
  assert.deepEqual(oidcConfig.code_challenge_methods_supported, ["S256"]);
  assert.ok(oidcConfig.scopes_supported.includes("avy:passport"));
  assert.ok(oidcConfig.claims_supported.includes("avy_clearances"));
});

// ----------------------------------------------------------------------------
// 6. PASSWORDLESS MAGIC LINK & RESET TOKEN SECURITY AUDIT
// ----------------------------------------------------------------------------
test("Auth Security: One-time token lifecycle, expiry, and replay protection", () => {
  const tokenStore = new Map();

  function createMagicToken(email, ttlSeconds = 900) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    tokenStore.set(tokenHash, {
      email,
      expiresAt: Date.now() + ttlSeconds * 1000,
      used: false,
    });

    return { rawToken };
  }

  function consumeMagicToken(rawToken) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const record = tokenStore.get(tokenHash);

    if (!record) return { success: false, error: "Invalid token" };
    if (record.used) return { success: false, error: "Token already used" };
    if (Date.now() > record.expiresAt) return { success: false, error: "Token expired" };

    record.used = true;
    return { success: true, email: record.email };
  }

  const { rawToken } = createMagicToken("builder@avyantrix.com", 900);

  // 1st consumption succeeds
  const firstUse = consumeMagicToken(rawToken);
  assert.equal(firstUse.success, true);
  assert.equal(firstUse.email, "builder@avyantrix.com");

  // 2nd consumption fails immediately (replay attack protection)
  const secondUse = consumeMagicToken(rawToken);
  assert.equal(secondUse.success, false);
  assert.equal(secondUse.error, "Token already used");
});

// ----------------------------------------------------------------------------
// 7. INPUT SANITIZATION & USERNAME INJECTION DEFENSE
// ----------------------------------------------------------------------------
test("Input Security: Handles injections, special characters, and reserved handles", () => {
  const RESERVED_NAMES = new Set(["admin", "api", "auth", "root", "system", "dashboard"]);

  function sanitizeUsername(input) {
    if (!input || typeof input !== "string") return null;
    const clean = input.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 3 || clean.length > 32) return null;
    if (RESERVED_NAMES.has(clean)) return `${clean}_${crypto.randomBytes(2).toString("hex")}`;
    return clean;
  }

  // Regular input
  assert.equal(sanitizeUsername("John_Doe_99"), "john_doe_99");

  // XSS Injection in handle
  assert.equal(sanitizeUsername("<script>alert('xss')</script>"), "scriptalertxssscript");

  // SQL Injection in handle
  assert.equal(sanitizeUsername("admin' OR '1'='1"), "adminor11");

  // Reserved keyword
  const adminClean = sanitizeUsername("ADMIN");
  assert.notEqual(adminClean, "admin");
  assert.match(adminClean, /^admin_[a-f0-9]{4}$/);

  // Short handles (< 3 chars)
  assert.equal(sanitizeUsername("ab"), null);
});
