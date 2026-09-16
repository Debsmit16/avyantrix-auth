import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const normalizedUsername = params.username.toLowerCase().trim();

    const profile = await prisma.userProfile.findUnique({
      where: { username: normalizedUsername },
      include: {
        user: {
          include: {
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
        },
      },
    });

    if (!profile || profile.user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Avyantrix profile not found." }, { status: 404 });
    }

    const visibility = (profile.visibilitySettings as any) || {
      show_email: false,
      show_education: true,
      show_location: true,
      show_links: true,
    };

    // Sanitize output strictly according to user privacy settings
    const publicProfile = {
      id: profile.user.id,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      headline: profile.headline,
      bio: profile.bio,
      location: visibility.show_location ? profile.location : null,
      collegeUniversity: visibility.show_education ? profile.collegeUniversity : null,
      graduationYear: visibility.show_education ? profile.graduationYear : null,
      currentStatus: profile.currentStatus,
      email: visibility.show_email ? profile.user.email : null,
      links: visibility.show_links
        ? {
            linkedin: profile.linkedinUrl,
            github: profile.githubUrl,
            portfolio: profile.portfolioUrl,
          }
        : null,
      roles: profile.user.userRoles.map((ur) => ur.role.name),
      skills: profile.user.userSkills.map((us) => ({
        name: us.skill.name,
        category: us.skill.category,
        proficiencyLevel: us.proficiencyLevel,
        isVerified: us.isVerified,
      })),
      verifiedBadges: profile.user.verificationBadges.map((b) => ({
        category: b.category,
        badgeLabel: b.badgeLabel,
        issuedAt: b.issuedAt,
      })),
      joinedAt: profile.user.createdAt,
    };

    return NextResponse.json({ profile: publicProfile });
  } catch (error) {
    console.error("Public profile fetch error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to fetch user profile." },
      { status: 500 }
    );
  }
}
