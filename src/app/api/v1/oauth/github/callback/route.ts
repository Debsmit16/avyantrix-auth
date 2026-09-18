import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { validateOAuthState, getGitHubUser, getAppBaseUrl } from "@/lib/auth/oauth";
import { createSession } from "@/lib/auth/session";
import { logLoginEvent, logSecurityEvent } from "@/lib/auth/audit";
import { isReservedUsername } from "@/lib/auth/reserved-usernames";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const baseUrl = getAppBaseUrl(req);

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(`GitHub authentication was cancelled: ${oauthError}`)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/login?error=Missing+GitHub+authorization+code`);
    }

    const stateValidation = validateOAuthState(state);
    if (!stateValidation.valid) {
      return NextResponse.redirect(`${baseUrl}/login?error=Invalid+or+expired+OAuth+session`);
    }

    const returnTo = stateValidation.returnTo || "/dashboard";

    const githubUser = await getGitHubUser(code, baseUrl);
    if (!githubUser.email) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=Unable+to+retrieve+verified+email+from+GitHub.+Please+ensure+your+GitHub+account+has+a+verified+primary+email.`
      );
    }

    const normalizedEmail = githubUser.email.toLowerCase().trim();

    // 1. Check if an account record already exists for this GitHub Account ID
    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: githubUser.id,
        },
      },
      include: { user: true },
    });

    let userId: string;

    if (account) {
      userId = account.userId;
    } else {
      // 2. Check if a user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        userId = existingUser.id;
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            provider: "github",
            providerAccountId: githubUser.id,
            providerEmail: normalizedEmail,
          },
        });

        if (!existingUser.emailVerified) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: true },
          });
        }

        await logSecurityEvent({
          userId: existingUser.id,
          eventType: "OAUTH_LINKED",
          ipAddress: ip,
          metadata: { provider: "github" },
        });
      } else {
        // 3. New User Registration via GitHub
        const builderRole = await prisma.role.findUnique({ where: { name: "BUILDER" } });

        const rawBase = (githubUser.login || normalizedEmail.split("@")[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .substring(0, 20) || "builder";

        let candidateUsername = isReservedUsername(rawBase)
          ? `${rawBase}_${crypto.randomBytes(2).toString("hex")}`
          : rawBase;

        let counter = 1;
        while (
          (await prisma.userProfile.findUnique({ where: { username: candidateUsername } })) ||
          isReservedUsername(candidateUsername)
        ) {
          candidateUsername = `${rawBase}_${counter++}`;
        }

        const nameParts = (githubUser.name || githubUser.login).trim().split(/\s+/);
        const firstName = nameParts[0] || "Builder";
        const lastName = nameParts.slice(1).join(" ") || "";

        const newUser = await prisma.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: {
              email: normalizedEmail,
              emailVerified: true,
              status: "ACTIVE",
            },
          });

          await tx.account.create({
            data: {
              userId: u.id,
              provider: "github",
              providerAccountId: githubUser.id,
              providerEmail: normalizedEmail,
            },
          });

          await tx.userProfile.create({
            data: {
              userId: u.id,
              username: candidateUsername,
              firstName,
              lastName,
              avatarUrl: githubUser.avatar_url || null,
              githubUrl: `https://github.com/${githubUser.login}`,
            },
          });

          if (builderRole) {
            await tx.userRole.create({
              data: {
                userId: u.id,
                roleId: builderRole.id,
              },
            });
          }

          return u;
        });

        userId = newUser.id;

        // Dispatch real-time webhook for new user creation
        dispatchWebhookEvent("user.created", {
          userId: newUser.id,
          email: normalizedEmail,
          username: candidateUsername,
          firstName,
          lastName,
          provider: "github",
          intendedRole: "BUILDER",
        }).catch(() => {});
      }
    }

    // Create session in Neon PostgreSQL
    await createSession({
      userId,
      ipAddress: ip,
      userAgent,
      deviceInfo: userAgent.substring(0, 100),
    });

    await logLoginEvent({
      userId,
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      status: "SUCCESS",
    });

    const destination = returnTo.startsWith("http") ? returnTo : `${baseUrl}${returnTo}`;
    return NextResponse.redirect(destination);
  } catch (error) {
    console.error("GitHub OAuth callback error:", (error as Error).message);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent((error as Error).message || "GitHub authentication failed")}`
    );
  }
}
