# AVYANTRIX AUTH V1 — REST API & OPENID CONNECT SPECIFICATION

Base URL: `https://auth.avyantrix.com/api/v1`

---

## 1. OpenID Connect & OAuth 2.0 Identity Endpoints

### 1.1 OIDC Discovery
- **Route:** `GET /.well-known/openid-configuration`
- **Runtime:** `nodejs`
- **Response (200 OK):**
  ```json
  {
    "issuer": "https://auth.avyantrix.com",
    "authorization_endpoint": "https://auth.avyantrix.com/api/v1/oauth/authorize",
    "token_endpoint": "https://auth.avyantrix.com/api/v1/oauth/token",
    "userinfo_endpoint": "https://auth.avyantrix.com/api/v1/oauth/userinfo",
    "response_types_supported": ["code"],
    "subject_types_supported": ["public"],
    "id_token_signing_alg_values_supported": ["HS256"],
    "scopes_supported": ["openid", "profile", "email"],
    "code_challenge_methods_supported": ["S256"]
  }
  ```

### 1.2 Authorize (Initiate SSO)
- **Route:** `GET /api/v1/oauth/authorize`
- **Runtime:** `nodejs`
- **Query Parameters:**
  - `client_id` (required): Registered client e.g. `avyantrix_builds`
  - `redirect_uri` (required): Registered redirect URI e.g. `https://builds.avyantrix.com/api/auth/callback`
  - `response_type` (required): `code`
  - `state` (optional): Opaque state parameter for CSRF mitigation
  - `scope` (optional): `openid profile email`
  - `code_challenge` (optional/mandatory for public clients): SHA-256 base64url PKCE challenge
  - `code_challenge_method` (required if challenge present): `S256` (**mandatory**, `plain` is rejected)
- **Flow:**
  - If user is logged into `auth.avyantrix.com`, immediately redirects to `redirect_uri?code={AUTH_CODE}&state={STATE}`.
  - If user is not logged in, redirects to `/login?return_to={ENCODED_AUTH_URL}`.

### 1.3 Token Exchange (OIDC ID Token + Access Token)
- **Route:** `POST /api/v1/oauth/token`
- **Runtime:** `nodejs`
- **Rate Limit:** 60 requests per minute per IP (PostgreSQL-backed)
- **Content-Type:** `application/json` or `application/x-www-form-urlencoded`
- **Request Body:**
  ```json
  {
    "grant_type": "authorization_code",
    "client_id": "avyantrix_builds",
    "client_secret": "confidential_secret_if_configured",
    "code": "raw_auth_code_hex",
    "redirect_uri": "https://builds.avyantrix.com/api/auth/callback",
    "code_verifier": "pkce_verifier_string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6ImF0K2p3dCJ9...",
    "token_type": "Bearer",
    "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "scope": "openid profile email"
  }
  ```

### 1.4 OIDC UserInfo
- **Route:** `GET /api/v1/oauth/userinfo`
- **Runtime:** `nodejs`
- **Header:** `Authorization: Bearer <access_token>`
- **Response (200 OK):**
  ```json
  {
    "sub": "c71e98d1-9f93-4a6c-...",
    "email": "alex@avyantrix.com",
    "email_verified": true,
    "preferred_username": "alexvance",
    "given_name": "Alex",
    "family_name": "Vance",
    "name": "Alex Vance",
    "picture": null,
    "headline": "Research Engineer",
    "roles": ["BUILDER"],
    "permissions": ["user.read", "verification.submit"],
    "badges": [
      {
        "category": "CAPABILITY_BUILDER",
        "badgeLabel": "Verified Builder",
        "issuedAt": "2026-09-16T10:00:00Z"
      }
    ]
  }
  ```

---

## 2. Primary Central Authentication Endpoints

### 2.1 Register
- **Route:** `POST /api/v1/auth/register`
- **Runtime:** `nodejs`
- **Rate Limit:** 5 requests per hour (PostgreSQL-backed)
- **Request Body:**
  ```json
  {
    "email": "developer@example.com",
    "password": "Correct-Horse-Battery-Staple-2026",
    "firstName": "Alex",
    "lastName": "Vance",
    "username": "alexvance"
  }
  ```
- **Password Policy:** Minimum 12 characters, max 128 characters, full passphrase support.
- **Role Assignment:** Exclusively provisions `BUILDER` role (cannot self-register as `ADMIN`).

### 2.2 Login (with Optional 2FA Challenge)
- **Route:** `POST /api/v1/auth/login`
- **Runtime:** `nodejs`
- **Rate Limit:** 5 failed attempts per 15 minutes per IP & email
- **Request Body:**
  ```json
  {
    "email": "developer@example.com",
    "password": "Correct-Horse-Battery-Staple-2026"
  }
  ```
- **Standard Response (200 OK):** Dispatches host-only cookie `avy_auth_session` and returns user details.
- **2FA Required Response (200 OK):**
  ```json
  {
    "twoFactorRequired": true,
    "twoFactorTempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2.3 Active Session Introspection
- **Route:** `GET /api/v1/auth/session`
- **Runtime:** `nodejs`
- **Authentication:** Host-Only Cookie

### 2.4 Logout & Multi-Device Logout
- `POST /api/v1/auth/logout`: Revokes active host session.
- `POST /api/v1/auth/logout-all`: Atomically deletes all session rows for `userId` in Neon PostgreSQL.

### 2.5 Password Recovery & Email Verification
- `POST /api/v1/auth/forgot-password`: Dispatches single-use reset token via Stalwart SMTP.
- `POST /api/v1/auth/reset-password`: Consumes reset token and immediately revokes all user sessions.
- `POST /api/v1/auth/change-password`: Authenticated password updates with current password verification.
- `POST /api/v1/auth/verify-email`: Activates email status.
- `POST /api/v1/auth/resend-verification`: Rate-limited token resend.

---

## 3. Two-Factor Authentication (2FA) Endpoints

Avyantrix ID implements RFC 6238 Time-based One-Time Passwords (TOTP) natively in pure Node.js `crypto` with zero third-party dependencies.

### 3.1 Setup 2FA
- **Route:** `POST /api/v1/auth/2fa/setup`
- **Authentication:** Active session required
- **Response (200 OK):**
  ```json
  {
    "secret": "JBSWY3DPEHPK3PXP",
    "otpAuthUri": "otpauth://totp/Avyantrix%20ID:alex%40avyantrix.com?secret=JBSWY3DPEHPK3PXP&issuer=Avyantrix%20ID&algorithm=SHA1&digits=6&period=30",
    "qrCodeSvg": "<svg xmlns=...></svg>"
  }
  ```

### 3.2 Enable 2FA & Generate Backup Codes
- **Route:** `POST /api/v1/auth/2fa/enable`
- **Authentication:** Active session required
- **Request Body:**
  ```json
  {
    "secret": "JBSWY3DPEHPK3PXP",
    "code": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Two-factor authentication enabled successfully.",
    "backupCodes": [
      "A1B2-C3D4",
      "E5F6-G7H8",
      "I9J0-K1L2",
      "M3N4-O5P6",
      "Q7R8-S9T0",
      "U1V2-W3X4",
      "Y5Z6-A7B8",
      "C9D0-E1F2"
    ]
  }
  ```

### 3.3 Verify 2FA Challenge during Login
- **Route:** `POST /api/v1/auth/2fa/verify`
- **Authentication:** Public with `twoFactorTempToken`
- **Request Body:**
  ```json
  {
    "tempToken": "eyJhbGciOiJIUzI1NiIs...",
    "code": "123456",
    "isBackupCode": false
  }
  ```
- **Response (200 OK):** Creates persistent session, dispatches `avy_auth_session` cookie, and returns user object.

### 3.4 Disable 2FA
- **Route:** `POST /api/v1/auth/2fa/disable`
- **Authentication:** Active session required
- **Request Body:**
  ```json
  {
    "password": "CurrentPassword123!",
    "code": "123456"
  }
  ```

---

## 4. Session & Device Management

- `GET /api/v1/auth/sessions`: Lists all active logged-in devices with IP, user-agent, creation, and last activity time.
- `DELETE /api/v1/auth/sessions/[id]`: Revokes a specific device session by ID.

---

## 5. Profile & Identity Endpoints

- `GET /api/v1/me`: Returns complete profile, roles, skills, 2FA status, and active badges.
- `PATCH /api/v1/me`: Updates profile fields and skills taxonomy.
- `GET /api/v1/users/[username]`: Public sanitized profile strictly filtered by user's `visibilitySettings`.

---

## 6. Dynamic Badges & OpenGraph Social Cards

### 6.1 Dynamic OpenGraph Banner Card (1200x630)
- **Route:** `GET /api/og/user/[username]`
- **Response:** Dynamic PNG image card suitable for LinkedIn, GitHub, Twitter, and Discord embeds.

### 6.2 Dynamic SVG README / Website Badge
- **Route:** `GET /api/v1/badges/[username]`
- **Response:** Crisp vector SVG badge displaying username, verified role, and Avyantrix seal.
- **Markdown Usage:**
  ```markdown
  [![Avyantrix ID](https://auth.avyantrix.com/api/v1/badges/alexvance)](https://auth.avyantrix.com/u/alexvance)
  ```

---

## 7. Capability Verification & Admin Review

- `POST /api/v1/verification/request`: Submits evidence references (`title`, `url`, `description`, `roleCategory`).
- `GET /api/v1/verification/status`: Tracks submission review states and awarded badges.
- `POST /api/v1/admin/verifications/[id]/review`: Reviewer approval or rejection with structured feedback.
  - On **APPROVED**: Issues verification badge and sends congratulations email with the Avyantrix seal.
  - On **REJECTED**: Updates request status and sends actionable rejection email detailing specific reviewer feedback for resubmission.

---

## 8. Avyantrix SSO Client SDK (`avyantrix-sso.ts`)

Sub-applications (`builds.avyantrix.com`, `challenges.avyantrix.com`) integrate seamlessly with Avyantrix ID using the standard client SDK:

```typescript
import { AvyantrixSSOClient } from "@/lib/sdk/avyantrix-sso";

const sso = new AvyantrixSSOClient({
  authBaseUrl: "https://auth.avyantrix.com",
  clientId: "avyantrix_builds",
  clientSecret: process.env.AVYANTRIX_CLIENT_SECRET, // optional for public apps
  redirectUri: "https://builds.avyantrix.com/api/auth/callback",
});

// 1. Initiate Login (generates PKCE code_verifier + challenge)
const { url, codeVerifier, state } = await sso.createAuthorizationUrl({
  scope: "openid profile email",
});
// Save codeVerifier and state in session/cookie, then redirect user to `url`

// 2. Handle OAuth Callback
const { accessToken, idToken, user } = await sso.exchangeCodeForTokens({
  code: req.query.code,
  codeVerifier: storedCodeVerifier,
});

console.log("Logged in user:", user.email, user.roles);
```
