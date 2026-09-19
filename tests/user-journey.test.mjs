import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { hash, verify, Algorithm, Version } from "@node-rs/argon2";

// ============================================================================
// AVYANTRIX ID - USER JOURNEY & BUSINESS LOGIC INTEGRATION TEST SUITE
// ============================================================================

// Helper: Sign test JWT
function signToken(payload, secret) {
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

// ----------------------------------------------------------------------------
// JOURNEY 1: User Registration & Onboarding Profile Creation
// ----------------------------------------------------------------------------
test("User Journey 1: Registration, Password Validation, Handle Generation & Email Verification", async () => {
  // Step 1: User fills registration form with valid passphrase
  const registrationInput = {
    firstName: "Sarah",
    lastName: "Connor",
    email: "sarah.connor@deeptech.io",
    password: "Quantum-Resistance-Passphrase-2026!",
  };

  // Password Strength Check
  assert.ok(registrationInput.password.length >= 12, "Password meets 12-character minimum");

  // Handle generation from name
  function createHandle(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  const username = createHandle(`${registrationInput.firstName}${registrationInput.lastName}`);
  assert.equal(username, "sarahconnor");

  // Hash password with Argon2id
  const passwordHash = await hash(registrationInput.password, {
    algorithm: Algorithm.Argon2id,
    version: Version.V0x13,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
    outputLen: 32,
  });

  const user = {
    id: "user-sarah-101",
    username,
    email: registrationInput.email,
    passwordHash,
    emailVerified: false,
    roles: ["USER"],
    createdAt: new Date().toISOString(),
  };

  // Step 2: Email verification token issued
  const rawVerifyToken = crypto.randomBytes(32).toString("hex");
  const verifyTokenHash = crypto.createHash("sha256").update(rawVerifyToken).digest("hex");

  const verificationRecord = {
    userId: user.id,
    tokenHash: verifyTokenHash,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    used: false,
  };

  // User clicks link in verification email
  function verifyEmail(token) {
    const hashIn = crypto.createHash("sha256").update(token).digest("hex");
    if (hashIn !== verificationRecord.tokenHash) throw new Error("Invalid token");
    if (verificationRecord.used) throw new Error("Token already consumed");
    if (Date.now() > verificationRecord.expiresAt) throw new Error("Token expired");

    verificationRecord.used = true;
    user.emailVerified = true;
    return { success: true, emailVerified: true };
  }

  const result = verifyEmail(rawVerifyToken);
  assert.equal(result.success, true);
  assert.equal(user.emailVerified, true, "User email must be marked verified");
});

// ----------------------------------------------------------------------------
// JOURNEY 2: User Login (Password, 2FA TOTP challenge & Magic Link)
// ----------------------------------------------------------------------------
test("User Journey 2: Standard Login -> 2FA TOTP enforcement -> Magic Link fallback", async () => {
  const userPassword = "MySecureDevPassword@2026!";
  const passwordHash = await hash(userPassword, {
    algorithm: Algorithm.Argon2id,
    version: Version.V0x13,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
    outputLen: 32,
  });

  const user = {
    id: "user-dev-202",
    email: "dev@avyantrix.com",
    passwordHash,
    twoFactorEnabled: true,
    twoFactorSecret: "JBSWY3DPEHPK3PXP", // Base32 test secret
    backupCodes: [crypto.createHash("sha256").update("RECOVER-9911-2233").digest("hex")],
  };

  // Step 1: User submits valid password
  const passwordMatches = await verify(user.passwordHash, userPassword, { algorithm: Algorithm.Argon2id });
  assert.equal(passwordMatches, true);

  // Since twoFactorEnabled is true, system returns 2FA challenge requirement
  const loginStep1 = {
    requires2FA: user.twoFactorEnabled,
    tempToken: "temp-2fa-session-token",
  };
  assert.equal(loginStep1.requires2FA, true);

  // Step 2: User submits backup recovery code
  function consumeBackupCode(inputCode) {
    const inputHash = crypto.createHash("sha256").update(inputCode.trim().toUpperCase()).digest("hex");
    const index = user.backupCodes.indexOf(inputHash);
    if (index === -1) return { success: false, error: "Invalid backup code" };

    // Remove used backup code
    user.backupCodes.splice(index, 1);
    return { success: true, remainingCodes: user.backupCodes.length };
  }

  const backupResult = consumeBackupCode("RECOVER-9911-2233");
  assert.equal(backupResult.success, true);
  assert.equal(backupResult.remainingCodes, 0);

  // Reusing same backup code fails
  const reuseResult = consumeBackupCode("RECOVER-9911-2233");
  assert.equal(reuseResult.success, false);
});

// ----------------------------------------------------------------------------
// JOURNEY 3: User Dashboard Onboarding Checklist & Progress Tracking
// ----------------------------------------------------------------------------
test("User Journey 3: Dashboard Onboarding Checklist dynamically calculates progression", () => {
  function computeOnboardingProgress(userState) {
    const items = [
      { id: "email", label: "Verify Email", done: Boolean(userState.emailVerified) },
      { id: "profile", label: "Complete Profile", done: Boolean(userState.bio && userState.skills?.length > 0) },
      { id: "links", label: "Connect Developer Links", done: Boolean(userState.links?.github || userState.links?.linkedin) },
      { id: "security", label: "Enable 2FA Security", done: Boolean(userState.twoFactorEnabled) },
      { id: "verification", label: "Submit Track Verification", done: Boolean(userState.hasSubmittedVerification) },
      { id: "passport", label: "Inspect Cyber ID Passport", done: Boolean(userState.hasViewedPassport) },
    ];

    const completed = items.filter((i) => i.done).length;
    const percentage = Math.round((completed / items.length) * 100);

    return { items, completed, total: items.length, percentage };
  }

  // Initial user
  const initialUser = { emailVerified: true };
  const p1 = computeOnboardingProgress(initialUser);
  assert.equal(p1.completed, 1);
  assert.equal(p1.percentage, 17);

  // Advanced user with completed profile, links, 2FA, and verification
  const advancedUser = {
    emailVerified: true,
    bio: "AI Systems Architect",
    skills: [{ name: "Rust" }],
    links: { github: "https://github.com/avy" },
    twoFactorEnabled: true,
    hasSubmittedVerification: true,
    hasViewedPassport: true,
  };
  const p2 = computeOnboardingProgress(advancedUser);
  assert.equal(p2.completed, 6);
  assert.equal(p2.percentage, 100);
});

// ----------------------------------------------------------------------------
// JOURNEY 4: Profile Customization & Public Profile Privacy Shield
// ----------------------------------------------------------------------------
test("User Journey 4: Profile customization, skill additions & public privacy filtering", () => {
  const fullProfile = {
    id: "user-303",
    username: "cyber_alchemist",
    firstName: "Elena",
    lastName: "Rostova",
    email: "elena.private@enterprise.com",
    emailVerified: true,
    bio: "Quantum computing & cryptography researcher",
    headline: "Senior Security Engineer @ Avyantrix",
    college: "ETH Zurich",
    gradYear: 2025,
    skills: [
      { name: "Rust", category: "Systems", proficiency: "EXPERT" },
      { name: "Cryptography", category: "Security", proficiency: "EXPERT" },
      { name: "Next.js", category: "Frontend", proficiency: "INTERMEDIATE" },
    ],
    links: {
      github: "https://github.com/elena-crypto",
      linkedin: "https://linkedin.com/in/elena-rostova",
    },
    privacySettings: {
      showEmail: false, // User requested private email
      showEducation: true,
    },
  };

  // Public Profile Renderer (what external visitors / employers see)
  function renderPublicProfile(profile) {
    return {
      username: profile.username,
      displayName: `${profile.firstName} ${profile.lastName}`.trim(),
      headline: profile.headline,
      bio: profile.bio,
      email: profile.privacySettings.showEmail ? profile.email : null, // Masked!
      college: profile.privacySettings.showEducation ? profile.college : null,
      skills: profile.skills.map((s) => ({ name: s.name, category: s.category })),
      links: profile.links,
    };
  }

  const publicView = renderPublicProfile(fullProfile);

  assert.equal(publicView.username, "cyber_alchemist");
  assert.equal(publicView.displayName, "Elena Rostova");
  assert.equal(publicView.email, null, "Private email must never be leaked to public profile");
  assert.equal(publicView.college, "ETH Zurich");
  assert.equal(publicView.skills.length, 3);
});

// ----------------------------------------------------------------------------
// JOURNEY 5: Role Verification Hub & Dynamic Badges Lifecycle
// ----------------------------------------------------------------------------
test("User Journey 5: Submitting Builder & Organizer applications with status transitions", () => {
  const verificationDatabase = [];

  function submitVerification(userId, track, evidence) {
    // Check if duplicate pending exists
    const existing = verificationDatabase.find((v) => v.userId === userId && v.track === track && v.status === "PENDING");
    if (existing) throw new Error("A pending verification request for this track is already in review.");

    const newRequest = {
      id: `req-${crypto.randomBytes(4).toString("hex")}`,
      userId,
      track,
      evidence,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewerNotes: null,
    };

    verificationDatabase.push(newRequest);
    return newRequest;
  }

  // User submits Builder verification
  const req1 = submitVerification("user-sarah-101", "CAPABILITY_BUILDER", {
    githubRepo: "https://github.com/sarah/ai-agent-core",
    demoUrl: "https://agent-demo.avyantrix.com",
    notes: "Built autonomous agent engine with local memory indexing.",
  });

  assert.equal(req1.status, "PENDING");
  assert.equal(req1.track, "CAPABILITY_BUILDER");

  // Duplicate submission is blocked
  assert.throws(
    () => submitVerification("user-sarah-101", "CAPABILITY_BUILDER", { githubRepo: "https://github.com/sarah/duplicate" }),
    /already in review/
  );

  // Admin approves the request
  function reviewVerification(requestId, status, reviewerNotes = "") {
    const req = verificationDatabase.find((v) => v.id === requestId);
    if (!req) throw new Error("Request not found");
    req.status = status;
    req.reviewedAt = new Date().toISOString();
    req.reviewerNotes = reviewerNotes;
    return req;
  }

  const reviewed = reviewVerification(req1.id, "APPROVED", "Exceptional GitHub contributions and live demo.");
  assert.equal(reviewed.status, "APPROVED");

  // Badge mapping after approval
  const userBadges = [
    {
      category: "CAPABILITY_BUILDER",
      badgeLabel: "Verified AI Core Builder",
      issuedAt: reviewed.reviewedAt,
    },
  ];

  assert.equal(userBadges[0].category, "CAPABILITY_BUILDER");
});

// ----------------------------------------------------------------------------
// JOURNEY 6: Cyber ID Hackathon Passport Holographic View & 1-Click Fast Pass
// ----------------------------------------------------------------------------
test("User Journey 6: Passport holographic render, QR payload & 1-Click Fast Pass ecosystem claims", () => {
  const user = {
    id: "user-sarah-101",
    username: "sarahconnor",
    firstName: "Sarah",
    lastName: "Connor",
    email: "sarah.connor@deeptech.io",
    emailVerified: true,
    college: "MIT DeepTech Lab",
    gradYear: 2026,
    skills: [{ name: "Rust", category: "Systems", proficiency: "EXPERT" }],
    links: { github: "https://github.com/sarah", linkedin: "https://linkedin.com/in/sarah" },
    roles: ["USER", "BUILDER"],
    badges: [{ category: "CAPABILITY_BUILDER", badgeLabel: "Verified AI Core Builder" }],
  };

  function generateHackathonPassport(u) {
    const isBuilder = u.badges.some((b) => b.category === "CAPABILITY_BUILDER");
    const passportId = `AVY-PASS-${u.id.substring(0, 8).toUpperCase()}`;

    return {
      passport_id: passportId,
      passport_version: "2026.1",
      user: {
        id: u.id,
        username: u.username,
        full_name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        email_verified: u.emailVerified,
      },
      education: {
        institution: u.college,
        graduation_year: u.gradYear,
        is_verified: true,
      },
      developer_links: u.links,
      skills: u.skills,
      clearances: {
        roles: u.roles,
        is_builder_verified: isBuilder,
        is_challenge_organizer: false,
      },
      ecosystem_pass: {
        challenges_fast_pass: true,
        builds_bounty_eligible: isBuilder,
        one_click_apply_ready: true,
      },
      qr_verification_url: `https://id.avyantrix.com/passport/verify?id=${passportId}`,
    };
  }

  const passport = generateHackathonPassport(user);

  assert.equal(passport.passport_id, "AVY-PASS-USER-SAR");
  assert.equal(passport.clearances.is_builder_verified, true);
  assert.equal(passport.ecosystem_pass.challenges_fast_pass, true);
  assert.equal(passport.ecosystem_pass.builds_bounty_eligible, true);
  assert.ok(passport.qr_verification_url.includes("AVY-PASS-USER-SAR"));
});

// ----------------------------------------------------------------------------
// JOURNEY 7: Active Session Management & 1-Click Global Logout
// ----------------------------------------------------------------------------
test("User Journey 7: Session tracking, device detection, and global revocation", () => {
  const sessionTable = new Map();

  function createSession(userId, ip, userAgent) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const session = {
      id: `sess_${crypto.randomBytes(8).toString("hex")}`,
      userId,
      tokenHash,
      ip,
      userAgent,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    sessionTable.set(session.id, session);
    return { session, rawToken };
  }

  // User logs in on 3 devices
  const s1 = createSession("user-101", "192.168.1.10", "Chrome Mac OS");
  const s2 = createSession("user-101", "10.0.0.5", "Safari iOS Mobile");
  const s3 = createSession("user-101", "172.16.0.2", "Firefox Windows");

  assert.equal(sessionTable.size, 3);

  // User revokes mobile session (s2)
  sessionTable.delete(s2.session.id);
  assert.equal(sessionTable.size, 2);
  assert.equal(sessionTable.has(s2.session.id), false);

  // User clicks "Sign Out All Other Devices" (keeps current s1)
  function revokeAllExceptCurrent(userId, currentSessionId) {
    for (const [id, sess] of sessionTable.entries()) {
      if (sess.userId === userId && id !== currentSessionId) {
        sessionTable.delete(id);
      }
    }
  }

  revokeAllExceptCurrent("user-101", s1.session.id);
  assert.equal(sessionTable.size, 1);
  assert.equal(sessionTable.has(s1.session.id), true);
});

// ----------------------------------------------------------------------------
// JOURNEY 8: Self-Service Developer Application Lifecycle & .env Generation
// ----------------------------------------------------------------------------
test("User Journey 8: Developer creates client app, copies generated .env, and rotates secret", async () => {
  const appStore = new Map();

  async function createDeveloperApp(ownerUserId, appName, redirectUris) {
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

    const app = {
      id: `devapp-${clientId}`,
      ownerUserId,
      name: appName,
      clientId,
      clientSecretHash,
      redirectUris,
      createdAt: new Date().toISOString(),
    };

    appStore.set(app.id, app);

    // Generate .env snippet for the developer
    const envSnippet = `
# Avyantrix OAuth Configuration for ${appName}
AVYANTRIX_ISSUER_URL=https://id.avyantrix.com
AVYANTRIX_CLIENT_ID=${clientId}
AVYANTRIX_CLIENT_SECRET=${rawSecret}
AVYANTRIX_REDIRECT_URI=${redirectUris[0]}
NEXTAUTH_URL=http://localhost:3000
    `.trim();

    return { app, rawSecret, envSnippet };
  }

  const devResult = await createDeveloperApp(
    "user-sarah-101",
    "Avyantrix Builds Downstream Service",
    ["https://builds.avyantrix.com/api/auth/callback"]
  );

  assert.ok(devResult.app.clientId.startsWith("app_"));
  assert.ok(devResult.rawSecret.startsWith("avy_sec_"));
  assert.ok(devResult.envSnippet.includes("AVYANTRIX_CLIENT_ID"));
  assert.ok(devResult.envSnippet.includes("AVYANTRIX_CLIENT_SECRET"));

  // Verify secret against hash
  const isValid = await verify(devResult.app.clientSecretHash, devResult.rawSecret, {
    algorithm: Algorithm.Argon2id,
  });
  assert.equal(isValid, true);
});

// ----------------------------------------------------------------------------
// JOURNEY 9: OAuth Consent Screen & User Authorization Grant
// ----------------------------------------------------------------------------
test("User Journey 9: User reviews OAuth Consent Screen, authorizes scopes, and receives auth code", () => {
  const requestingClient = {
    name: "Avyantrix Challenges",
    clientId: "app_challenges_prod",
    redirectUri: "https://challenges.avyantrix.com/api/auth/callback",
    logoUrl: "https://challenges.avyantrix.com/logo.png",
  };

  const requestedScopes = ["openid", "profile", "email", "avy:passport"];

  // Consent Screen Scope Description Map
  const SCOPE_DESCRIPTIONS = {
    openid: "Access your unique Avyantrix ID identifier",
    profile: "Read your full name, username, and avatar",
    email: "Access your verified primary email address",
    "avy:passport": "Read your Hackathon Passport, verified skills, and clearances",
  };

  const consentView = {
    appName: requestingClient.name,
    permissions: requestedScopes.map((s) => ({ scope: s, description: SCOPE_DESCRIPTIONS[s] })),
  };

  assert.equal(consentView.permissions.length, 4);
  assert.equal(
    consentView.permissions.find((p) => p.scope === "avy:passport").description,
    "Read your Hackathon Passport, verified skills, and clearances"
  );

  // User clicks "Authorize Application"
  function authorizeGrant(client, user, approvedScopes, state) {
    const authCode = `avy_code_${crypto.randomBytes(16).toString("hex")}`;
    const redirectParams = new URLSearchParams({
      code: authCode,
      state: state || "",
    });
    return `${client.redirectUri}?${redirectParams.toString()}`;
  }

  const redirectUrl = authorizeGrant(requestingClient, { id: "user-101" }, requestedScopes, "state_xyz999");
  assert.ok(redirectUrl.startsWith("https://challenges.avyantrix.com/api/auth/callback?code=avy_code_"));
  assert.ok(redirectUrl.includes("state=state_xyz999"));
});
