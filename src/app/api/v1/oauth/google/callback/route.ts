import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { validateOAuthState, getGoogleUser, getAppBaseUrl } from "@/lib/auth/oauth";
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
        `${baseUrl}/login?error=${encodeURIComponent(`Google authentication was cancelled: ${oauthError}`)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/login?error=Missing+Google+authorization+code`);
    }

    const stateValidation = validateOAuthState(state);
    if (!stateValidation.valid) {
      return NextResponse.redirect(`${baseUrl}/login?error=Invalid+or+expired+OAuth+session`);
    }

    const returnTo = stateValidation.returnTo || "/dashboard";

    const googleUser = await getGoogleUser(code, baseUrl);
    if (!googleUser.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=Unable+to+retrieve+email+from+Google`);
    }

    const normalizedEmail = googleUser.email.toLowerCase().trim();

    // 1. Check if an account record already exists for this Google Account ID
    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleUser.id,
        },
      },
      include: { user: true },
    });

    let userId: string;

    if (account) {
      userId = account.userId;
    } else {
      // 2. Check if a user with this verified email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        // Link Google account to existing user
        userId = existingUser.id;
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            provider: "google",
            providerAccountId: googleUser.id,
            providerEmail: normalizedEmail,
          },
        });

        // If user wasn't verified, Google verified email validates them
        if (!existingUser.emailVerified && googleUser.verified_email) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: true },
          });
        }

        await logSecurityEvent({
          userId: existingUser.id,
          eventType: "OAUTH_LINKED",
          ipAddress: ip,
          metadata: { provider: "google" },
        });
      } else {
        // 3. New User Registration via Google
        const builderRole = await prisma.role.findUnique({ where: { name: "BUILDER" } });

        // Generate a clean, unique username based on name or email prefix
        const rawBase = (googleUser.name || normalizedEmail.split("@")[0])
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

        const firstName = googleUser.given_name || googleUser.name.split(" ")[0] || "Builder";
        const lastName = googleUser.family_name || googleUser.name.split(" ").slice(1).join(" ") || "";

        const newUser = await prisma.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: {
              email: normalizedEmail,
              emailVerified: googleUser.verified_email ?? true,
              status: "ACTIVE",
            },
          });

          await tx.account.create({
            data: {
              userId: u.id,
              provider: "google",
              providerAccountId: googleUser.id,
              providerEmail: normalizedEmail,
            },
          });

          await tx.userProfile.create({
            data: {
              userId: u.id,
              username: candidateUsername,
              firstName,
              lastName,
              avatarUrl: googleUser.picture || null,
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
          provider: "google",
          intendedRole: "BUILDER",
        }).catch(() => {});
      }
    }

    // Create session in Neon PostgreSQL and dispatch cookie
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
    console.error("Google OAuth callback error:", (error as Error).message);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent((error as Error).message || "Google authentication failed")}`
    );
  }
}
