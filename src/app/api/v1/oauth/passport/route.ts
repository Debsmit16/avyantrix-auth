import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { verifyJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { handleCorsPreflight, getCorsHeaders } from "@/lib/auth/cors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  try {
    let userId: string | null = null;

    // 1. Check Bearer Token (OAuth 2.0 / OIDC)
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyJwt<{ sub: string; aud?: string; scope?: string }>(token);
        userId = decoded.sub;
      } catch (jwtErr) {
        return NextResponse.json(
          { error: "Invalid or expired access token", code: "INVALID_TOKEN" },
          { status: 401, headers: cors }
        );
      }
    }

    // 2. Fallback to active HttpOnly Cookie Session
    if (!userId) {
      const session = await getSession();
      if (session) {
        userId = session.userId;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required via Bearer token or session cookie", code: "UNAUTHORIZED" },
        { status: 401, headers: cors }
      );
    }

    // 3. Fetch comprehensive applicant record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        accounts: {
          select: {
            provider: true,
            createdAt: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
        userSkills: {
          include: {
            skill: true,
          },
        },
        verificationBadges: {
          where: { isActive: true },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "User account is suspended, deleted, or not found", code: "ACCOUNT_INACTIVE" },
        { status: 403, headers: cors }
      );
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const badges = user.verificationBadges.map((b) => ({
      category: b.category,
      badgeLabel: b.badgeLabel,
      issuedAt: b.issuedAt.toISOString(),
    }));

    const isEducationVerified = badges.some((b) => b.category === "EDUCATION");
    const isBuilderVerified = badges.some((b) => b.category === "CAPABILITY_BUILDER");
    const isChallengeOrganizer = roles.includes("CHALLENGE_ORGANIZER") || badges.some((b) => b.category === "CHALLENGE_ORGANIZER");
    const isProblemOwner = roles.includes("PROBLEM_OWNER") || badges.some((b) => b.category === "PROBLEM_OWNER");

    const passportData = {
      passport_id: `AVY-PASS-${user.id.substring(0, 8).toUpperCase()}`,
      passport_version: "2026.1",
      issuer: process.env.APP_URL || "https://auth.avyantrix.com",
      issued_at: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.profile?.username || "builder",
        full_name: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || "Avyantrix Builder",
        first_name: user.profile?.firstName || "",
        last_name: user.profile?.lastName || "",
        email: user.email,
        email_verified: user.emailVerified,
        avatar_url: user.profile?.avatarUrl || null,
        headline: user.profile?.headline || null,
        bio: user.profile?.bio || null,
        location: user.profile?.location || null,
        member_since: user.createdAt.toISOString(),
      },
      education: {
        institution: user.profile?.collegeUniversity || null,
        graduation_year: user.profile?.graduationYear || null,
        current_status: user.profile?.currentStatus || "Builder",
        is_verified: isEducationVerified,
      },
      developer_links: {
        github: user.profile?.githubUrl || null,
        linkedin: user.profile?.linkedinUrl || null,
        portfolio: user.profile?.portfolioUrl || null,
        connected_providers: user.accounts.map((a) => a.provider),
      },
      skills: user.userSkills.map((us) => ({
        name: us.skill.name,
        category: us.skill.category,
        proficiency: us.proficiencyLevel,
        is_verified: us.isVerified,
      })),
      clearances: {
        roles,
        is_builder_verified: isBuilderVerified,
        is_education_verified: isEducationVerified,
        is_challenge_organizer: isChallengeOrganizer,
        is_problem_owner: isProblemOwner,
        active_badges: badges,
      },
      ecosystem_pass: {
        challenges_fast_pass: true,
        builds_bounty_eligible: isBuilderVerified || roles.includes("BUILDER"),
        one_click_apply_supported: true,
      },
    };

    return NextResponse.json(passportData, {
      headers: {
        ...cors,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("Passport fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving passport", code: "SERVER_ERROR" },
      { status: 500, headers: cors }
    );
  }
}
