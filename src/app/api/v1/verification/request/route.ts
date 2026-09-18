import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VerificationCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const verificationRequestSchema = z.object({
  category: z.enum([
    "IDENTITY",
    "EDUCATION",
    "CAPABILITY_BUILDER",
    "PROBLEM_OWNER",
    "MENTOR",
    "CHALLENGE_ORGANIZER",
  ]),
  notes: z.string().max(4000).optional(),
  evidence: z.array(
    z.object({
      evidenceType: z.enum([
        "GITHUB_REPO",
        "DEPLOYED_URL",
        "PORTFOLIO",
        "CERTIFICATE",
        "RESEARCH_PAPER",
        "CREDENTIAL_LINK",
        "DOCUMENT_REFERENCE",
      ]),
      title: z.string().min(1).max(200),
      evidenceUrl: z.string().url().max(500).optional().nullable(),
      description: z.string().max(2000).optional(),
    })
  ).min(1, "At least one evidence item or proof link must be provided."),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const session = await requireAuth();
    const body = await req.json();
    const parseResult = verificationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid verification request." },
        { status: 400 }
      );
    }

    const { category, notes, evidence } = parseResult.data;

    // 1. Check if the user already has an ACTIVE verified badge for this category
    const activeBadge = await prisma.verificationBadge.findFirst({
      where: {
        userId: session.userId,
        category: category as VerificationCategory,
        isActive: true,
      },
    });

    if (activeBadge) {
      return NextResponse.json(
        {
          error: `This role is already verified and assigned to your account.`,
        },
        { status: 400 }
      );
    }

    // 2. Check if there is already a PENDING request for this category
    const pendingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId: session.userId,
        category: category as VerificationCategory,
        status: "PENDING",
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { error: `You already have a pending verification request under review for this role.` },
        { status: 409 }
      );
    }

    // Create verification request and structured private evidence
    const request = await prisma.verificationRequest.create({
      data: {
        userId: session.userId,
        category: category as VerificationCategory,
        status: "PENDING",
        notes,
        evidence: {
          create: evidence.map((e) => ({
            evidenceType: e.evidenceType,
            title: e.title,
            evidenceUrl: e.evidenceUrl || null,
            evidencePayload: e.description ? { description: e.description } : undefined,
            isPrivate: true, // Strictly private
          })),
        },
      },
      include: {
        evidence: true,
      },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "VERIFICATION_SUBMITTED",
      ipAddress: ip,
      metadata: { requestId: request.id, category },
    });

    return NextResponse.json(
      {
        message: "Verification request submitted successfully. The Avyantrix review team will assess your submission.",
        request,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Verification submit error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to submit verification request." },
      { status: 500 }
    );
  }
}
