# AVYANTRIX AUTH V1 — OPERATIONS & DEPLOYMENT RUNBOOK

---

## 1. Environment Variables Configuration

In Vercel and local `.env.production` / `.env.local`, configure the following variables:

```ini
# ==========================================
# 1. DATABASE (Neon PostgreSQL)
# ==========================================
# Neon managed pooler endpoint (used by serverless API handlers):
DATABASE_URL="postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/avyantrix_auth?sslmode=require&pgbouncer=true"

# Neon direct endpoint (used exclusively by prisma migrate deploy):
DIRECT_URL="postgres://user:password@ep-sample.us-east-2.aws.neon.tech/avyantrix_auth?sslmode=require"

# ==========================================
# 2. APPLICATION & OIDC CONFIGURATION
# ==========================================
NODE_ENV="production"
APP_URL="https://auth.avyantrix.com"
SESSION_COOKIE_NAME="avy_auth_session"
SESSION_MAX_AGE_SECONDS="2592000" # 30 days
OIDC_JWT_SECRET="generate-a-cryptographically-secure-32-byte-secret-for-jwt-signing"

# ==========================================
# 3. Stalwart Mail Server (SMTP)
# ==========================================
SMTP_HOST="mail.avyantrix.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="auth-service@avyantrix.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Avyantrix ID <noreply@avyantrix.com>"

# ==========================================
# 4. OAuth Providers (Google & GitHub)
# ==========================================
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# ==========================================
# 5. Security & Admin Provisioning Secret
# ==========================================
ADMIN_BOOTSTRAP_SECRET="generate-a-secure-random-secret-here"
```

---

## 2. Production Database Deployment (Prisma Migrate)

For production deployment against Neon PostgreSQL:

```bash
# 1. Deploy tracked migrations to production database:
pnpm prisma migrate deploy

# 2. Seed baseline roles, permissions, skills taxonomy, and OAuth clients:
pnpm prisma db seed
```

> [!IMPORTANT]
> `pnpm prisma db push` is strictly for local rapid prototyping. In production, always use `pnpm prisma migrate deploy` to ensure migration integrity.

---

## 3. Vercel Deployment Configuration

1. **Framework Preset:** Next.js
2. **Root Directory:** `avyantrix-auth`
3. **Build Command:** `pnpm prisma generate && pnpm next build`
4. **Install Command:** `pnpm install`
5. **Node.js Version:** 20.x or current LTS
6. **Domains:** Map `auth.avyantrix.com` in Vercel Project Settings with DNS CNAME pointing to `cname.vercel-dns.com`.

---

## 4. Admin Account Bootstrap

To provision the initial administrator safely without raw database manipulation:
1. Register the founder account via `https://auth.avyantrix.com/register`.
2. Verify email via link dispatched to the inbox.
3. Run the bootstrap CLI command from a secure environment:
   ```bash
   pnpm run admin:bootstrap --email=founder@avyantrix.com --secret=$ADMIN_BOOTSTRAP_SECRET
   ```
4. Access the administrative dashboard at `https://auth.avyantrix.com/admin`.
