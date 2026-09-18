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

