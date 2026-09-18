import crypto from "crypto";

export interface AvyantrixSSOConfig {
  issuerUrl?: string; // Default: https://auth.avyantrix.com
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope?: string;
}

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  id_token: string;
  expires_in: number;
  scope: string;
}

export interface AvyantrixUserClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  preferred_username: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string | null;
  headline?: string | null;
  roles: string[];
  permissions: string[];
  badges: Array<{
    category: string;
    badgeLabel: string;
    issuedAt: string;
  }>;
}

export class AvyantrixSSOClient {
  private issuerUrl: string;
  private clientId: string;
  private clientSecret?: string;
  private redirectUri: string;
  private scope: string;

  constructor(config: AvyantrixSSOConfig) {
    this.issuerUrl = (config.issuerUrl || "https://auth.avyantrix.com").replace(/\/$/, "");
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.scope = config.scope || "openid profile email";
  }

  /**
   * Generates a cryptographically secure PKCE code verifier and S256 code challenge.
   */
  public generatePkce(): PkcePair {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    return { codeVerifier, codeChallenge };
  }

  /**
   * Constructs the full authorization URL to redirect the user for login.
   */
  public getAuthorizationUrl(params: { state?: string; codeChallenge?: string } = {}): string {
    const url = new URL(`${this.issuerUrl}/api/v1/oauth/authorize`);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.scope);

    if (params.state) {
      url.searchParams.set("state", params.state);
    }
    if (params.codeChallenge) {
      url.searchParams.set("code_challenge", params.codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
    }

    return url.toString();
  }

  /**
   * Exchanges an authorization code for OpenID Connect ID Token & Access Token.
   */
  public async exchangeCode(code: string, codeVerifier?: string): Promise<TokenResponse> {
    const body: Record<string, string> = {
      grant_type: "authorization_code",
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
    };

    if (this.clientSecret) {
      body.client_secret = this.clientSecret;
    }
    if (codeVerifier) {
      body.code_verifier = codeVerifier;
    }

    const res = await fetch(`${this.issuerUrl}/api/v1/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to exchange authorization code for tokens.");
    }

    return data as TokenResponse;
  }

  /**
   * Fetches full authoritative user profile & verified badges using the Bearer Access Token.
   */
  public async getUserInfo(accessToken: string): Promise<AvyantrixUserClaims> {
    const res = await fetch(`${this.issuerUrl}/api/v1/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch user info.");
    }

    return data as AvyantrixUserClaims;
  }

  /**
   * Decodes an ID Token payload without signature verification for client-side claim inspection.
   */
  public decodeIdToken(idToken: string): AvyantrixUserClaims {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format.");
    }

    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload) as AvyantrixUserClaims;
  }
}
