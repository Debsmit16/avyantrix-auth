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

### 2.2 Login
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
- **Cookie Dispatched:** `avy_auth_session` (**Host-Only** on `auth.avyantrix.com`, `HttpOnly`, `Secure`, `SameSite=Lax`).

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
- `POST /api/v1/auth/verify-email`: Activates email status.
- `POST /api/v1/auth/resend-verification`: Rate-limited token resend.

---

## 3. Session & Device Management

- `GET /api/v1/auth/sessions`: Lists all active logged-in devices with IP, user-agent, creation, and last activity time.
- `DELETE /api/v1/auth/sessions/[id]`: Revokes a specific device session by ID.

---

## 4. Profile & Identity Endpoints

- `GET /api/v1/me`: Returns complete profile, roles, skills, and active badges.
- `PATCH /api/v1/me`: Updates profile fields and skills taxonomy.
- `GET /api/v1/users/[username]`: Public sanitized profile strictly filtered by user's `visibilitySettings`.

---

## 5. Capability Verification Endpoints (V1 Scope)

- `POST /api/v1/verification/request`: Submits structured evidence references (`GITHUB_REPO`, `DEPLOYED_URL`, `RESEARCH_PAPER`, `CREDENTIAL_LINK`).
- `GET /api/v1/verification/status`: Tracks submission review states and awarded badges.

---

## 6. Admin & Governance Endpoints

- `GET /api/v1/admin/users`: Search and filter user roster (requires `admin.manage_users`).
- `PATCH /api/v1/admin/users/[id]/status`: Update account status (`ACTIVE`, `SUSPENDED`) and invalidate active sessions.
- `POST /api/v1/admin/users/[id]/roles`: Assign ecosystem roles (requires `admin.manage_users`).
- `GET /api/v1/admin/verifications`: View pending verification queue (requires `verification.review`).
- `POST /api/v1/admin/verifications/[id]/review`: Review and approve/reject verification requests, issuing verification badges.
- `GET /api/v1/admin/audit-logs`: View immutable login and security audit trails (requires `admin.view_audit`).
