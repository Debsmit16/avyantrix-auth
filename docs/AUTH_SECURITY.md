# AVYANTRIX AUTH V1 — SECURITY ARCHITECTURE & CONTROLS

---

## 1. Cryptographic Standard: Argon2id Only

Avyantrix Auth V1 standardizes exclusively on **Argon2id** (RFC 9106) for password hashing. Legacy hashing algorithms (bcrypt/scrypt) are strictly prohibited.

### Argon2id Configuration Parameters:
```typescript
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 1,    // 1 lane (serverless optimized)
  hashLength: 32,    // 256-bit output hash
};
```

### Modernized Password Policy:
- Minimum length: 12 characters (maximum: 128 characters)
- Full passphrase support (spaces and arbitrary phrases welcome)
- No artificial character-class forcing
- Automatic rejection of common/trivial passwords (e.g. sequences, dictionary phrases)

---

## 2. Host-Only Session Security & Trust Isolation

### Trust Boundary Architecture
- The central session cookie (`avy_auth_session`) is strictly **Host-Only** to `auth.avyantrix.com`.
- The cookie domain is NOT wildcarded across `.avyantrix.com`.
- **Threat Mitigation:** A vulnerability in any subdomain or downstream application cannot access, read, or compromise the master Avyantrix authentication session.

### Central Session Token Security:
1. **256-bit Entropy:** Tokens are generated via `crypto.randomBytes(32)`.
2. **One-Way Token Hashing:** Raw tokens exist only on the user's client cookie. PostgreSQL stores and indexes only `SHA-256(raw_token)`.
3. **Cookie Attributes:** `HttpOnly=true`, `Secure=true`, `SameSite=Lax`, `Path=/`.

---

## 3. OpenID Connect & OAuth 2.0 Security

### OIDC Token Security
1. **Signed OIDC ID Token (`id_token`):** Cryptographically signed JWT using HMAC-SHA256 (`HS256`) with standard claims (`iss`, `sub`, `aud`, `exp`, `iat`, `auth_time`, `email`, `preferred_username`, `roles`, `badges`).
2. **Signed Access Token (`access_token`):** Cryptographically signed Bearer JWT (`at+jwt`) scoped to the client.
3. **Mandatory S256 PKCE:** Public clients must use PKCE with `code_challenge_method=S256` (RFC 7636). The weaker `plain` method is strictly rejected.
4. **Short-Lived Authorization Codes:** Authorization codes have a 5-minute TTL, are stored as SHA-256 hashes, and are burned atomically on first exchange (`usedAt = now()`).
5. **Client Whitelisting:** Redirect URIs are strictly validated against pre-registered client configurations.
6. **Downstream Session Isolation:** Each downstream app creates its own host-only local session upon token exchange.

---

## 4. Durable Distributed Rate Limiting

Rate limiting is backed by Neon PostgreSQL (`RateLimitRecord` table) to maintain consistent quotas across serverless function instances on Vercel:

| Endpoint | Threshold | Window | Storage |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | 5 failed attempts | 15 minutes | PostgreSQL (`RateLimitRecord`) |
| `/api/v1/auth/register` | 5 attempts | 1 hour | PostgreSQL (`RateLimitRecord`) |
| `/api/v1/auth/forgot-password` | 3 attempts | 1 hour | PostgreSQL (`RateLimitRecord`) |
| `/api/v1/oauth/token` | 60 requests | 1 minute | PostgreSQL (`RateLimitRecord`) |

---

## 5. Node.js Runtime Enforcement

To avoid executing Argon2id native C++ bindings or database drivers in incompatible Edge environments, all authentication, password hashing, and SMTP routes declare:
```typescript
export const runtime = "nodejs";
```

---

## 6. Secure Admin Provisioning Runbook

To prevent self-elevation and eliminate dangerous ad-hoc SQL execution:
1. Founder registers through standard flow (`https://auth.avyantrix.com/register`).
2. Founder verifies email.
3. Administrator runs the one-time bootstrap script from a secured terminal:
   ```bash
   pnpm run admin:bootstrap --email=founder@avyantrix.com --secret=$ADMIN_BOOTSTRAP_SECRET
   ```
4. The script verifies identity, assigns the `ADMIN` role, and writes an immutable `ADMIN_GRANTED` entry to the `security_events` audit table.
