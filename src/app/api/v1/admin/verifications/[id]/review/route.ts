import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reviewSchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
  reviewNotes: z.string().max(2000).optional(),
  badgeLabel: z.string().max(100).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const reviewer = await requirePermission("verification.review");
    const requestId = params.id;
    const body = await req.json();
    const parseResult = reviewSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid review payload." },
        { status: 400 }
      );
    }

    const { decision, reviewNotes, badgeLabel } = parseResult.data;

    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
    }

    // Atomic update of verification request & badge creation
    await prisma.$transaction(async (tx) => {
      await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          reviewerId: reviewer.userId,
          reviewNotes: reviewNotes || null,
          reviewedAt: new Date(),
        },
      });

      if (decision === "VERIFIED") {
        const defaultBadgeLabels: Record<string, string> = {
          IDENTITY: "Identity Verified",
          EDUCATION: "Education Verified",
          CAPABILITY_BUILDER: "Verified Builder",
          PROBLEM_OWNER: "Verified Problem Owner",
          MENTOR: "Verified Mentor",
          CHALLENGE_ORGANIZER: "Verified Organizer",
        };

        const label = badgeLabel || defaultBadgeLabels[request.category] || "Verified";

        await tx.verificationBadge.upsert({
          where: {
            userId_category: {
              userId: request.userId,
              category: request.category,
            },
          },
          update: {
            badgeLabel: label,
            isActive: true,
            issuedAt: new Date(),
          },
          create: {
            userId: request.userId,
            category: request.category,
            badgeLabel: label,
            isActive: true,
          },
        });

        // Automatically provision corresponding RBAC Role
        const roleMapping: Record<string, string> = {
          CAPABILITY_BUILDER: "BUILDER",
          PROBLEM_OWNER: "PROBLEM_OWNER",
          MENTOR: "MENTOR",
          CHALLENGE_ORGANIZER: "CHALLENGE_ORGANIZER",
        };

        const targetRoleName = roleMapping[request.category];
        if (targetRoleName) {
          const roleRecord = await tx.role.findUnique({
            where: { name: targetRoleName },
          });

          if (roleRecord) {
            await tx.userRole.upsert({
              where: {
                userId_roleId: {
                  userId: request.userId,
                  roleId: roleRecord.id,
                },
              },
              update: {},
              create: {
                userId: request.userId,
                roleId: roleRecord.id,
                assignedBy: reviewer.userId,
              },
            });
          }
        }
      } else if (decision === "REJECTED") {
        await tx.verificationBadge.updateMany({
          where: {
            userId: request.userId,
            category: request.category,
          },
          data: { isActive: false },
        });
      }
    });

    await logSecurityEvent({
      userId: reviewer.userId,
      eventType: decision === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
      ipAddress: ip,
      metadata: {
        requestId,
        targetUserId: request.userId,
        category: request.category,
        decision,
      },
    });

    return NextResponse.json({
      message: `Verification request ${decision.toLowerCase()} successfully.`,
    });
  } catch (error) {
    console.error("Verification review error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "Forbidden" },
      { status: 403 }
    );
  }
}
