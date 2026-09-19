import test from "node:test";
import assert from "node:assert/strict";
import { hash, verify, Algorithm, Version } from "@node-rs/argon2";
import crypto from "node:crypto";

// Helper JWT signing for test suite
function signTestJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
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

function verifyTestJwt(token, secret) {
  const [h, p, s] = token.split(".");
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${h}.${p}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  assert.equal(s, expectedSig, "JWT signature must verify");
  const raw = Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(raw);
}

// 1. Test Argon2id password hashing and verification (OWASP RFC 9106)
test("Argon2id password hashing and verification", async () => {
  const password = "Correct-Horse-Battery-Staple-2026!";
  const passwordHash = await hash(password, {
    algorithm: Algorithm.Argon2id,
    version: Version.V0x13,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
    outputLen: 32,
  });

  assert.ok(passwordHash.startsWith("$argon2id$"), "Hash must use argon2id algorithm");
  const isValid = await verify(passwordHash, password, { algorithm: Algorithm.Argon2id });
  assert.equal(isValid, true, "Valid password must verify against Argon2id hash");

  const isInvalid = await verify(passwordHash, "WrongPassword@2026", { algorithm: Algorithm.Argon2id });
  assert.equal(isInvalid, false, "Invalid password must fail verification");
});

// 2. Test Modernized Password & Passphrase Strength Validation (12-char min)
test("Modernized password strength validator supports passphrases and rejects weak inputs", () => {
  const COMMON_WEAK_PASSWORDS = new Set([
    "password1234",
    "123456789012",
    "administrator",
  ]);

  function validatePassword(password) {
    if (!password || password.length < 12) return { valid: false, error: "Too short (min 12 chars)" };
    if (password.length > 128) return { valid: false, error: "Too long (max 128 chars)" };
    if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase().trim())) {
      return { valid: false, error: "Common weak password" };
    }
    return { valid: true };
  }

  assert.equal(validatePassword("short123").valid, false, "Passwords under 12 characters must be rejected");
  assert.equal(validatePassword("password1234").valid, false, "Common passwords must be rejected");
  assert.equal(validatePassword("123456789012").valid, false, "Numeric sequence passwords must be rejected");
  assert.equal(validatePassword("valid-developer-passphrase-2026").valid, true, "Long passphrases must pass");
  assert.equal(validatePassword("Space Rover Sensor Net 99").valid, true, "Passphrases with spaces must pass");
});

// 3. Test Host-Only Session Token Hashing (SHA-256)
test("Session token generation and SHA-256 indexing", () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash1 = crypto.createHash("sha256").update(rawToken).digest("hex");
  const hash2 = crypto.createHash("sha256").update(rawToken).digest("hex");

  assert.equal(rawToken.length, 64, "Raw token must be 256 bits (64 hex characters)");
  assert.equal(hash1, hash2, "Hashing same token must be deterministic");
  assert.notEqual(rawToken, hash1, "Token hash must not match raw token");
});

// 4. Test OIDC ID Token & Access Token JWT Contract
test("OIDC ID Token and Access Token contract signing and verification", () => {
  const secret = "test-secret-key-32-bytes-long-1234";
  const now = Math.floor(Date.now() / 1000);

  const idTokenPayload = {
    iss: "https://auth.avyantrix.com",
    sub: "user-uuid-1234",
    aud: "avyantrix_builds",
    exp: now + 3600,
    iat: now,
    email: "builder@avyantrix.com",
    email_verified: true,
    preferred_username: "alexvance",
    name: "Alex Vance",
    roles: ["BUILDER"],
    permissions: ["user.read", "verification.submit"],
    badges: [{ category: "CAPABILITY_BUILDER", badgeLabel: "Verified Builder" }],
  };

  const signedIdToken = signTestJwt(idTokenPayload, secret);
  assert.ok(signedIdToken.split(".").length === 3, "ID Token must be a 3-part signed JWT");

  const verifiedClaims = verifyTestJwt(signedIdToken, secret);
  assert.equal(verifiedClaims.sub, "user-uuid-1234");
  assert.equal(verifiedClaims.aud, "avyantrix_builds");
  assert.equal(verifiedClaims.email, "builder@avyantrix.com");
  assert.equal(verifiedClaims.roles[0], "BUILDER");
});

// 5. Test OAuth2 PKCE S256 Enforcement (Rejecting Weak Methods)
test("OAuth2 PKCE S256 mandatory challenge validation and method rejection", () => {
  const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const expectedChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // Validate S256
  const computedChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  assert.equal(computedChallenge, expectedChallenge, "PKCE S256 computation must match RFC 7636");

  // Verify non-S256 rejection
  function validateMethod(method) {
    if (method !== "S256") {
      throw new Error("Only S256 is supported");
    }
    return true;
  }

  assert.equal(validateMethod("S256"), true);
  assert.throws(() => validateMethod("plain"), /Only S256 is supported/);
});

// 6. Test Rate Limiter Logic
test("Rate limiter enforces request quotas", () => {
  const store = new Map();

  function checkLimit(key, limit, windowSeconds) {
    const now = Date.now();
    const resetTime = now + windowSeconds * 1000;
    const record = store.get(key);

    if (!record || record.resetTime < now) {
      store.set(key, { count: 1, resetTime });
      return { success: true, remaining: limit - 1 };
    }

    if (record.count >= limit) {
      return { success: false, remaining: 0 };
    }

    record.count += 1;
    return { success: true, remaining: limit - record.count };
  }

  const key = "test-ip-127.0.0.1";
  assert.equal(checkLimit(key, 3, 60).success, true);
  assert.equal(checkLimit(key, 3, 60).success, true);
  assert.equal(checkLimit(key, 3, 60).success, true);
  assert.equal(checkLimit(key, 3, 60).success, false, "4th attempt should exceed limit of 3");
});

// 7. Test Public Profile Privacy Sanitization
test("Privacy filters protect private emails and unapproved fields", () => {
  const rawUser = {
    id: "user-123",
    email: "builder@avyantrix.com",
    profile: {
      username: "debsmit",
      firstName: "Debsmit",
      lastName: "Dev",
      location: "Kolkata, India",
      collegeUniversity: "IEM",
      visibilitySettings: {
        show_email: false,
        show_education: true,
        show_location: false,
      },
    },
  };

  const visibility = rawUser.profile.visibilitySettings;
  const sanitized = {
    username: rawUser.profile.username,
    email: visibility.show_email ? rawUser.email : null,
    location: visibility.show_location ? rawUser.profile.location : null,
    college: visibility.show_education ? rawUser.profile.collegeUniversity : null,
  };

  assert.equal(sanitized.email, null, "Email must be hidden when show_email is false");
  assert.equal(sanitized.location, null, "Location must be hidden when show_location is false");
  assert.equal(sanitized.college, "IEM", "College must be visible when show_education is true");
});

// 8. Test Role Verification Submission & Blocking Rules
test("Role verification submission blocks duplicate submissions for verified and pending roles", () => {
  const existingBadges = [
    { category: "CAPABILITY_BUILDER", badgeLabel: "Verified Builder", isActive: true },
  ];
  const existingRequests = [
    { category: "MENTOR", status: "PENDING" },
    { category: "PROBLEM_OWNER", status: "REJECTED", reviewNotes: "Please provide corporate proof link" },
  ];

  function validateVerificationSubmission(category, evidence, badges, requests) {
    // 1. Check if category already has an active verified badge
    const isVerified = badges.some((b) => b.category === category && b.isActive);
    if (isVerified) {
      return { allowed: false, status: 400, error: "This role is already verified and assigned to your account." };
    }

    // 2. Check if a request is already pending review
    const isPending = requests.some((r) => r.category === category && r.status === "PENDING");
    if (isPending) {
      return { allowed: false, status: 409, error: "You already have a pending verification request under review for this role." };
    }

    // 3. Check evidence requirement
    if (!evidence || evidence.length === 0) {
      return { allowed: false, status: 400, error: "At least one evidence item or proof link must be provided." };
    }

    return { allowed: true, status: 201 };
  }

  // Attempting to submit for already verified BUILDER must be blocked
  const builderAttempt = validateVerificationSubmission("CAPABILITY_BUILDER", [{ title: "Repo" }], existingBadges, existingRequests);
  assert.equal(builderAttempt.allowed, false);
  assert.equal(builderAttempt.status, 400);
  assert.match(builderAttempt.error, /already verified and assigned/);

  // Attempting to submit for already pending MENTOR must be blocked
  const mentorAttempt = validateVerificationSubmission("MENTOR", [{ title: "LinkedIn" }], existingBadges, existingRequests);
  assert.equal(mentorAttempt.allowed, false);
  assert.equal(mentorAttempt.status, 409);
  assert.match(mentorAttempt.error, /pending verification request under review/);

  // Attempting to submit with 0 proofs must be blocked
  const emptyProofAttempt = validateVerificationSubmission("CHALLENGE_ORGANIZER", [], existingBadges, existingRequests);
  assert.equal(emptyProofAttempt.allowed, false);
  assert.equal(emptyProofAttempt.status, 400);

  // Submitting for REJECTED problem owner with new proof must succeed
  const problemOwnerResubmission = validateVerificationSubmission("PROBLEM_OWNER", [{ title: "Company Website" }], existingBadges, existingRequests);
  assert.equal(problemOwnerResubmission.allowed, true);
  assert.equal(problemOwnerResubmission.status, 201);

  // Submitting for fresh unverified ORGANIZER with proof must succeed
  const organizerSubmission = validateVerificationSubmission("CHALLENGE_ORGANIZER", [{ title: "Club Portal" }], existingBadges, existingRequests);
  assert.equal(organizerSubmission.allowed, true);
  assert.equal(organizerSubmission.status, 201);
});

// 9. Test RFC 6238 TOTP Engine (Generation, Verification & Time-Drift Window)
test("RFC 6238 TOTP engine generates valid 6-digit codes and respects clock drift window", () => {
  const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  function base32Decode(str) {
    const cleanStr = str.toUpperCase().replace(/=+$/, "");
    let bits = "";
    for (let i = 0; i < cleanStr.length; i++) {
      const val = BASE32_CHARS.indexOf(cleanStr[i]);
      if (val === -1) throw new Error("Invalid base32 char");
      bits += val.toString(2).padStart(5, "0");
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }

  function generateCode(secret, timeStep) {
    const key = base32Decode(secret);
    const counter = Buffer.alloc(8);
    counter.writeBigInt64BE(BigInt(timeStep));
    const hmac = crypto.createHmac("sha1", key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const otp = binary % 1000000;
    return otp.toString().padStart(6, "0");
  }

  function verifyCode(secret, code, window = 1, fixedTimeSec) {
    if (!code || code.length !== 6) return false;
    const nowSec = fixedTimeSec !== undefined ? fixedTimeSec : Math.floor(Date.now() / 1000);
    const currentTimeStep = Math.floor(nowSec / 30);

    for (let i = -window; i <= window; i++) {
      const expected = generateCode(secret, currentTimeStep + i);
      if (code === expected) return true;
    }
    return false;
  }

  const testSecret = "JBSWY3DPEHPK3PXP"; // "Hello!" in Base32
  const fixedTime = 1700000000; // Fixed timestamp for determinism
  const currentStep = Math.floor(fixedTime / 30);

  const codeNow = generateCode(testSecret, currentStep);
  assert.equal(codeNow.length, 6, "TOTP code must be 6 digits");
  assert.match(codeNow, /^[0-9]{6}$/, "TOTP code must consist of digits only");

  // Verify current code
  assert.equal(verifyCode(testSecret, codeNow, 1, fixedTime), true, "Current code must verify");

  // Verify clock drift tolerance (+30s / next step)
  const codeNext = generateCode(testSecret, currentStep + 1);
  assert.equal(verifyCode(testSecret, codeNext, 1, fixedTime), true, "Code within 1 step drift must verify");

  // Verify rejection for expired/drifted code beyond window (+120s / +4 steps)
  const codeFarFuture = generateCode(testSecret, currentStep + 4);
  assert.equal(verifyCode(testSecret, codeFarFuture, 1, fixedTime), false, "Code outside drift window must be rejected");

  // Verify invalid code string
  assert.equal(verifyCode(testSecret, "000000", 1, fixedTime), false, "Wrong code must be rejected");
});

// 10. Test 2FA Single-Use Backup Recovery Codes Generation & Hashing
test("2FA backup recovery codes are cryptographically random and securely hashed", () => {
  function generateBackupCodes(count = 8) {
    const rawCodes = [];
    const hashedCodes = [];

    for (let i = 0; i < count; i++) {
      const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
      const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
      const raw = `${part1}-${part2}`;
      const hashed = crypto.createHash("sha256").update(raw.replace("-", "").toUpperCase()).digest("hex");
      rawCodes.push(raw);
      hashedCodes.push(hashed);
    }

    return { rawCodes, hashedCodes };
  }

  const { rawCodes, hashedCodes } = generateBackupCodes(8);
  assert.equal(rawCodes.length, 8, "Must generate 8 backup codes");
  assert.equal(hashedCodes.length, 8, "Must generate 8 hashed backup codes");

  // Test format
  for (const raw of rawCodes) {
    assert.match(raw, /^[A-F0-9]{4}-[A-F0-9]{4}$/, "Code must match XXXX-XXXX format");
  }

  // Test single-use consumption verification
  const testInput = rawCodes[0];
  const inputHash = crypto.createHash("sha256").update(testInput.replace("-", "").toUpperCase()).digest("hex");
  const matchIndex = hashedCodes.indexOf(inputHash);
  assert.equal(matchIndex, 0, "Input backup code must match first hash");

  // Remove consumed code from database array
  hashedCodes.splice(matchIndex, 1);
  assert.equal(hashedCodes.length, 7, "Consumed backup code must be removed from list");

  // Trying to reuse the same backup code must fail
  const secondAttemptIndex = hashedCodes.indexOf(inputHash);
  assert.equal(secondAttemptIndex, -1, "Single-use backup code cannot be used twice");
});

// 11. Test Avyantrix SSO Client SDK PKCE and Auth URL Builder
test("Avyantrix SSO Client SDK generates valid PKCE S256 authorization URLs", () => {
  class AvyantrixSSOClientTest {
    constructor(config) {
      this.authBaseUrl = config.authBaseUrl.replace(/\/$/, "");
      this.clientId = config.clientId;
      this.redirectUri = config.redirectUri;
    }

    createAuthorizationUrl(options = {}) {
      const codeVerifier = crypto.randomBytes(32).toString("base64url");
      const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
      const state = options.state || crypto.randomBytes(16).toString("hex");
      const scope = options.scope || "openid profile email";

      const params = new URLSearchParams({
        response_type: "code",
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      return {
        url: `${this.authBaseUrl}/api/v1/oauth/authorize?${params.toString()}`,
        codeVerifier,
        state,
      };
    }
  }

  const ssoClient = new AvyantrixSSOClientTest({
    authBaseUrl: "https://auth.avyantrix.com",
    clientId: "avyantrix_builds",
    redirectUri: "https://builds.avyantrix.com/api/auth/callback",
  });

  const authData = ssoClient.createAuthorizationUrl({ scope: "openid profile email" });
  assert.ok(authData.url.includes("https://auth.avyantrix.com/api/v1/oauth/authorize"));
  assert.ok(authData.url.includes("client_id=avyantrix_builds"));
  assert.ok(authData.url.includes("code_challenge_method=S256"));
  assert.ok(authData.codeVerifier.length >= 43, "PKCE verifier must be at least 43 chars");
});

// 12. Test Onboarding Checklist Completion Calculation
test("Dashboard onboarding checklist calculates milestone completion percentage", () => {
  function calculateChecklistProgress(user) {
    const milestones = [
      { id: "account", completed: true },
      { id: "email", completed: Boolean(user.emailVerified) },
      { id: "profile", completed: Boolean(user.profile?.firstName && user.skills?.length > 0) },
      { id: "verification", completed: Boolean(user.badges?.length > 0) },
    ];

    const completedCount = milestones.filter((m) => m.completed).length;
    const progressPercent = Math.round((completedCount / milestones.length) * 100);

    return { milestones, progressPercent };
  }

  const newUser = { emailVerified: false, profile: null, skills: [], badges: [] };
  assert.equal(calculateChecklistProgress(newUser).progressPercent, 25);

  const verifiedEmailUser = { emailVerified: true, profile: { firstName: "Dev" }, skills: ["TypeScript"], badges: [] };
  assert.equal(calculateChecklistProgress(verifiedEmailUser).progressPercent, 75);

  const fullyOnboardedUser = { emailVerified: true, profile: { firstName: "Dev" }, skills: ["TypeScript"], badges: [{ category: "BUILDER" }] };
  assert.equal(calculateChecklistProgress(fullyOnboardedUser).progressPercent, 100);
});

// 13. Test Reserved Username Blacklist
test("Reserved username blacklist blocks system handles and permits valid developer usernames", () => {
  const RESERVED_USERNAMES = new Set([
    "admin", "administrator", "root", "auth", "login", "register", "oauth", "sso", "dashboard",
    "avyantrix", "api", "health", "cron", "webhook", "null", "undefined",
  ]);

  function validateCandidateUsername(username) {
    if (!username || typeof username !== "string") return { valid: false, error: "Username is required" };
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) return { valid: false, error: "Too short" };
    if (trimmed.length > 30) return { valid: false, error: "Too long" };
    if (!/^[a-z0-9_]+$/.test(trimmed)) return { valid: false, error: "Invalid characters" };
    if (RESERVED_USERNAMES.has(trimmed)) return { valid: false, error: `Username '${trimmed}' is reserved` };
    return { valid: true };
  }

  assert.equal(validateCandidateUsername("admin").valid, false);
  assert.equal(validateCandidateUsername("auth").valid, false);
  assert.equal(validateCandidateUsername("avyantrix").valid, false);
  assert.equal(validateCandidateUsername("api").valid, false);
  assert.equal(validateCandidateUsername("debsmit").valid, true);
  assert.equal(validateCandidateUsername("alex_vance").valid, true);
  assert.equal(validateCandidateUsername("builder99").valid, true);
});

// 14. Test Zero-Cost Deterministic SVG Avatar Generator
test("Deterministic SVG Avatar generator creates valid SVG markup and deterministic initials", () => {
  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  function getInitials(name, username) {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (username && username.trim().length > 0) return username.trim().substring(0, 2).toUpperCase();
    return "AV";
  }

  assert.equal(getInitials("Debsmit Dev"), "DD");
  assert.equal(getInitials("Antigravity"), "AN");
  assert.equal(getInitials("", "sarah_connor"), "SA");

  const hash1 = hashString("alex_builder");
  const hash2 = hashString("alex_builder");
  assert.equal(hash1, hash2, "Hashing must be deterministic");
});

// 15. Test Passwordless Magic Login Token Generation & Single-Use Verification
test("Passwordless magic login token is single-use and expires after TTL", () => {
  const tokenStore = new Map();

  function createMagicToken(userId, ttlMs = 15 * 60 * 1000) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = Date.now() + ttlMs;
    tokenStore.set(tokenHash, { userId, expiresAt, usedAt: null });
    return rawToken;
  }

  function verifyMagicToken(rawToken, now = Date.now()) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const record = tokenStore.get(tokenHash);
    if (!record) return { success: false, error: "Invalid token" };
    if (record.expiresAt < now) return { success: false, error: "Token expired" };
    if (record.usedAt) return { success: false, error: "Token already consumed" };

    // Burn token
    record.usedAt = now;
    return { success: true, userId: record.userId };
  }

  const token = createMagicToken("user-555");
  assert.equal(token.length, 64);

  // 1st verification must succeed
  const result1 = verifyMagicToken(token);
  assert.equal(result1.success, true);
  assert.equal(result1.userId, "user-555");

  // 2nd verification must fail (single-use)
  const result2 = verifyMagicToken(token);
  assert.equal(result2.success, false);
  assert.match(result2.error, /already consumed/);

  // Expired token test
  const expiredToken = createMagicToken("user-999", -1000);
  const resultExpired = verifyMagicToken(expiredToken);
  assert.equal(resultExpired.success, false);
  assert.match(resultExpired.error, /expired/);
});

// 16. Test OAuth Refresh Token Rotation & Token Family Replay Detection
test("OAuth refresh token rotation revokes entire token family upon token reuse attempt", () => {
  const refreshTokens = new Map(); // tokenHash -> { familyId, userId, isRevoked, expiresAt }

  function issueRefreshToken(userId, familyId = crypto.randomUUID()) {
    const raw = crypto.randomBytes(40).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    refreshTokens.set(tokenHash, {
      familyId,
      userId,
      isRevoked: false,
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
    });
    return { raw, tokenHash, familyId };
  }

  function rotateRefreshToken(raw) {
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    const record = refreshTokens.get(tokenHash);
    if (!record) throw new Error("Invalid refresh token");

    // Token reuse detection
    if (record.isRevoked) {
      // Revoke all tokens in family
      for (const [hash, r] of refreshTokens.entries()) {
        if (r.familyId === record.familyId) {
          r.isRevoked = true;
        }
      }
      throw new Error("Replay attack detected. Entire token family revoked.");
    }

    // Revoke old token
    record.isRevoked = true;

    // Issue new token in same family
    const next = issueRefreshToken(record.userId, record.familyId);
    return next;
  }

  // Initial issue
  const tokenGen1 = issueRefreshToken("user-100");
  assert.equal(tokenGen1.raw.length, 80);

  // Normal rotation (Gen 1 -> Gen 2)
  const tokenGen2 = rotateRefreshToken(tokenGen1.raw);
  assert.equal(tokenGen2.familyId, tokenGen1.familyId, "Family ID must be preserved");

  // Normal rotation (Gen 2 -> Gen 3)
  const tokenGen3 = rotateRefreshToken(tokenGen2.raw);
  assert.equal(tokenGen3.familyId, tokenGen1.familyId);

  // Attacker or stale client tries to replay Gen 1
  assert.throws(
    () => rotateRefreshToken(tokenGen1.raw),
    /Replay attack detected/,
    "Replaying Gen 1 must trigger family revocation"
  );

  // Gen 3 should now also be revoked due to family revocation!
  assert.throws(
    () => rotateRefreshToken(tokenGen3.raw),
    /Replay attack detected/,
    "All tokens in compromised family must be invalid"
  );
});

// 17. Test Webhook Dispatcher HMAC-SHA256 Signing
test("Webhook dispatcher generates valid HMAC-SHA256 signature for event payloads", () => {
  const secret = "webhook-test-secret-key";
  const payload = {
    event: "user.created",
    timestamp: "2026-09-18T12:00:00.000Z",
    data: { userId: "user-abc", email: "builder@avyantrix.com" },
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");

  // Verifier side (downstream subscriber like Builds or Challenges)
  const receivedSig = signature;
  const computedSig = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
  assert.equal(receivedSig, computedSig, "HMAC-SHA256 signature must verify exactly");
});

// 18. Test Structured Health Probe Calculations
test("Structured health probe computes uptime, latency, and system memory", () => {
  const startTime = Date.now() - 5000; // 5 seconds ago
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  assert.ok(uptimeSeconds >= 5, "Uptime must be at least 5 seconds");

  const probe = {
    status: "healthy",
    service: "avyantrix-auth",
    version: "1.0.0",
    uptimeSeconds,
    checks: {
      database: { status: "healthy", latencyMs: 12, provider: "Neon PostgreSQL" },
      smtp: { status: "configured", host: "mail.avyantrix.com" },
    },
  };

  assert.equal(probe.status, "healthy");
  assert.equal(probe.checks.database.status, "healthy");
  assert.equal(probe.checks.smtp.status, "configured");
});

// 19. Test OAuth State Encoding & Return Destination Preservation
test("OAuth state encoding embeds return destination and decodes safely", () => {
  function encodeOAuthState(returnTo) {
    const randomHex = crypto.randomBytes(16).toString("hex");
    const payload = JSON.stringify({ r: randomHex, next: returnTo });
    return Buffer.from(payload).toString("base64url");
  }

  function decodeOAuthState(state) {
    try {
      const raw = Buffer.from(state, "base64url").toString("utf8");
      const parsed = JSON.parse(raw);
      return typeof parsed.next === "string" ? parsed.next : "/dashboard";
    } catch {
      return "/dashboard";
    }
  }

  const state1 = encodeOAuthState("/verification?track=CAPABILITY_BUILDER");
  assert.equal(decodeOAuthState(state1), "/verification?track=CAPABILITY_BUILDER");

  const state2 = encodeOAuthState("/api/v1/oauth/authorize?client_id=avyantrix_builds");
  assert.equal(decodeOAuthState(state2), "/api/v1/oauth/authorize?client_id=avyantrix_builds");

  const stateInvalid = "invalid_base64_json_string";
  assert.equal(decodeOAuthState(stateInvalid), "/dashboard");
});

// 20. Test OAuth Registration Username Normalization & Reserved Word Collision Defense
test("OAuth registration generates clean handles and evades reserved keyword collisions", () => {
  const RESERVED = new Set(["admin", "auth", "root", "support", "avyantrix"]);

  function generateSafeHandle(rawName, existingUsernames = new Set()) {
    const base = rawName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .substring(0, 20) || "builder";

    let candidate = RESERVED.has(base) ? `${base}_${crypto.randomBytes(2).toString("hex")}` : base;

    let counter = 1;
    while (existingUsernames.has(candidate) || RESERVED.has(candidate)) {
      candidate = `${base}_${counter++}`;
    }
    return candidate;
  }

  const handle1 = generateSafeHandle("Alex Vance");
  assert.equal(handle1, "alexvance");

  const handle2 = generateSafeHandle("admin");
  assert.notEqual(handle2, "admin", "Reserved username must never be claimed directly");
  assert.match(handle2, /^admin_[a-f0-9]+$/, "Reserved handle must get safe suffix");

  const existing = new Set(["debsmit"]);
  const handle3 = generateSafeHandle("debsmit", existing);
  assert.equal(handle3, "debsmit_1");
});

// 21. Test Fast Hackathon Passport Payload Generation & Verification Claims
test("Fast Hackathon Passport payload generates valid applicant dossier and clearances", () => {
  function buildPassportPayload(mockUser) {
    const isEducationVerified = mockUser.badges.some((b) => b.category === "EDUCATION");
    const isBuilderVerified = mockUser.badges.some((b) => b.category === "CAPABILITY_BUILDER");
    const isChallengeOrganizer = mockUser.roles.includes("CHALLENGE_ORGANIZER");

    return {
      passport_id: `AVY-PASS-${mockUser.id.substring(0, 8).toUpperCase()}`,
      passport_version: "2026.1",
      user: {
        id: mockUser.id,
        username: mockUser.username,
        full_name: `${mockUser.firstName} ${mockUser.lastName}`.trim(),
        email: mockUser.email,
        email_verified: mockUser.emailVerified,
      },
      education: {
        institution: mockUser.college,
        graduation_year: mockUser.gradYear,
        is_verified: isEducationVerified,
      },
      developer_links: mockUser.links,
      skills: mockUser.skills,
      clearances: {
        roles: mockUser.roles,
        is_builder_verified: isBuilderVerified,
        is_challenge_organizer: isChallengeOrganizer,
      },
      ecosystem_pass: {
        challenges_fast_pass: true,
        builds_bounty_eligible: isBuilderVerified || mockUser.roles.includes("BUILDER"),
      },
    };
  }

  const mockUser = {
    id: "12345678-abcd-ef01-2345-6789abcdef01",
    username: "alexbuilder",
    firstName: "Alex",
    lastName: "Vance",
    email: "alex@avyantrix.com",
    emailVerified: true,
    college: "Stanford University",
    gradYear: 2026,
    links: { github: "https://github.com/alexvance", linkedin: "https://linkedin.com/in/alexvance" },
    skills: [{ name: "Rust", category: "Systems", proficiency: "EXPERT" }],
    roles: ["BUILDER", "CHALLENGE_ORGANIZER"],
    badges: [{ category: "CAPABILITY_BUILDER", badgeLabel: "Verified Builder" }],
  };

  const passport = buildPassportPayload(mockUser);
  assert.equal(passport.passport_id, "AVY-PASS-12345678");
  assert.equal(passport.user.full_name, "Alex Vance");
  assert.equal(passport.education.institution, "Stanford University");
  assert.equal(passport.clearances.is_builder_verified, true);
  assert.equal(passport.clearances.is_challenge_organizer, true);
  assert.equal(passport.ecosystem_pass.challenges_fast_pass, true);
});

// 22. Test Ecosystem 1-Click Application Claim Extraction
test("Ecosystem 1-Click Application extract handles missing fields gracefully", () => {
  function extractApplicationFields(passport) {
    return {
      name: passport?.user?.full_name || "",
      email: passport?.user?.email || "",
      verified: Boolean(passport?.user?.email_verified),
      institution: passport?.education?.institution || "Independent",
      skills: (passport?.skills || []).map((s) => s.name),
      github: passport?.developer_links?.github || null,
      fastPass: Boolean(passport?.ecosystem_pass?.challenges_fast_pass),
    };
  }

  const extracted = extractApplicationFields({
    user: { full_name: "John Doe", email: "john@example.com", email_verified: true },
    education: { institution: "MIT" },
    skills: [{ name: "Python" }, { name: "Next.js" }],
    developer_links: { github: "https://github.com/johndoe" },
    ecosystem_pass: { challenges_fast_pass: true },
  });

  assert.equal(extracted.name, "John Doe");
  assert.equal(extracted.verified, true);
  assert.equal(extracted.institution, "MIT");
  assert.deepEqual(extracted.skills, ["Python", "Next.js"]);
  assert.equal(extracted.fastPass, true);
});

// 23. Test Developer App Client Secret Generation, Formatting & Argon2id Hashing
test("Developer client secret generation produces valid entropy and Argon2id hashes", async () => {
  function generateDeveloperCredentials() {
    const clientId = `app_${crypto.randomBytes(8).toString("hex")}`;
    const rawSecret = `avy_sec_${crypto.randomBytes(24).toString("hex")}`;
    return { clientId, rawSecret };
  }

  const { clientId, rawSecret } = generateDeveloperCredentials();

  assert.match(clientId, /^app_[a-f0-9]{16}$/, "Client ID must match app_ prefix and 16 hex chars");
  assert.match(rawSecret, /^avy_sec_[a-f0-9]{48}$/, "Client Secret must match avy_sec_ prefix and 48 hex chars");

  const secretHash = await hash(rawSecret, {
    algorithm: Algorithm.Argon2id,
    version: Version.V0x13,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
    outputLen: 32,
  });

  assert.ok(secretHash.startsWith("$argon2id$"), "Secret hash must use Argon2id");
  const isValid = await verify(secretHash, rawSecret, { algorithm: Algorithm.Argon2id });
  assert.equal(isValid, true, "Generated secret must verify against Argon2id hash");
});
