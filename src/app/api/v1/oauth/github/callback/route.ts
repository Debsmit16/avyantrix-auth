import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOAuthState, getGitHubUser } from "@/lib/auth/oauth";
import { createSession } from "@/lib/auth/session";
import { logLoginEvent, logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://auth.avyantrix.com";

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state || !validateOAuthState(state)) {
      return NextResponse.redirect(`${appUrl}/login?error=Invalid+OAuth+state+or+code`);
    }

    const githubUser = await getGitHubUser(code);
    if (!githubUser.email) {
      return NextResponse.redirect(`${appUrl}/login?error=Unable+to+retrieve+verified+email+from+GitHub`);
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
        
        const baseUsername = (githubUser.login || normalizedEmail.split("@")[0])
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "")
          .substring(0, 20) || "builder";

        let candidateUsername = baseUsername;
        let counter = 1;
        while (await prisma.userProfile.findUnique({ where: { username: candidateUsername } })) {
          candidateUsername = `${baseUsername}${counter++}`;
        }

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

          const nameParts = (githubUser.name || githubUser.login).split(" ");
          await tx.userProfile.create({
            data: {
              userId: u.id,
              username: candidateUsername,
              firstName: nameParts[0] || "Builder",
              lastName: nameParts.slice(1).join(" ") || "",
              avatarUrl: githubUser.avatar_url,
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

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    console.error("GitHub OAuth error:", (error as Error).message);
    return NextResponse.redirect(`${appUrl}/login?error=GitHub+authentication+failed`);
  }
}
