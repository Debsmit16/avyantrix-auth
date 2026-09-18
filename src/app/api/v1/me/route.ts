import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  collegeUniversity: z.string().max(200).optional().nullable(),
  graduationYear: z.number().int().min(1970).max(2035).optional().nullable(),
  currentStatus: z.string().max(100).optional().nullable(),
  linkedinUrl: z.string().url().max(300).optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().max(300).optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url().max(300).optional().nullable().or(z.literal("")),
  visibilitySettings: z
    .object({
      show_email: z.boolean().optional(),
      show_education: z.boolean().optional(),
      show_location: z.boolean().optional(),
      show_links: z.boolean().optional(),
    })
    .optional(),
  skills: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        proficiencyLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
        accounts: {
          select: {
            provider: true,
            providerEmail: true,
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

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        hasPassword: Boolean(user.passwordHash),
        twoFactorEnabled: user.twoFactorEnabled,
        status: user.status,
        createdAt: user.createdAt,
        profile: user.profile,
        accounts: user.accounts,
        roles: user.userRoles.map((ur) => ur.role.name),
        skills: user.userSkills.map((us) => ({
          id: us.skill.id,
          name: us.skill.name,
          category: us.skill.category,
          proficiencyLevel: us.proficiencyLevel,
          isVerified: us.isVerified,
        })),
        badges: user.verificationBadges,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parseResult = updateProfileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Update profile data in Neon PostgreSQL
    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.headline !== undefined) updateData.headline = data.headline;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.collegeUniversity !== undefined) updateData.collegeUniversity = data.collegeUniversity;
    if (data.graduationYear !== undefined) updateData.graduationYear = data.graduationYear;
    if (data.currentStatus !== undefined) updateData.currentStatus = data.currentStatus;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl || null;
    if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl || null;
    if (data.portfolioUrl !== undefined) updateData.portfolioUrl = data.portfolioUrl || null;
    if (data.visibilitySettings !== undefined) updateData.visibilitySettings = data.visibilitySettings;

    await prisma.userProfile.update({
      where: { userId: session.userId },
      data: updateData,
    });

    // Handle user skills updates if provided
    if (data.skills) {
      await prisma.userSkill.deleteMany({
        where: { userId: session.userId },
      });

      if (data.skills.length > 0) {
        await prisma.userSkill.createMany({
          data: data.skills.map((s) => ({
            userId: session.userId,
            skillId: s.skillId,
            proficiencyLevel: s.proficiencyLevel || "INTERMEDIATE",
          })),
        });
      }
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    await logSecurityEvent({
      userId: session.userId,
      eventType: "ROLE_GRANTED",
      ipAddress: ip,
      metadata: { action: "profile_updated" },
    });

    return NextResponse.json({
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Profile update error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
