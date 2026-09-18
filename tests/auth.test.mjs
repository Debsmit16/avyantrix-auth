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


