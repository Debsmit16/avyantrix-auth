import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const issuer = process.env.APP_URL || "https://auth.avyantrix.com";

  return NextResponse.json(
    {
      issuer,
      authorization_endpoint: `${issuer}/api/v1/oauth/authorize`,
      token_endpoint: `${issuer}/api/v1/oauth/token`,
      userinfo_endpoint: `${issuer}/api/v1/oauth/userinfo`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["HS256"],
      scopes_supported: ["openid", "profile", "email"],
      token_endpoint_auth_methods_supported: [
        "client_secret_post",
        "client_secret_basic",
        "none",
      ],
      claims_supported: [
        "sub",
        "iss",
        "aud",
        "exp",
        "iat",
        "auth_time",
        "email",
        "email_verified",
        "preferred_username",
        "name",
        "given_name",
        "family_name",
        "picture",
        "roles",
        "permissions",
        "badges",
      ],
      code_challenge_methods_supported: ["S256"],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
