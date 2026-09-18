import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createClientSchema = z.object({
  clientId: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9_-]+$/, "Client ID can only contain lowercase letters, numbers, hyphens, and underscores."),
  name: z.string().min(1).max(150),
  redirectUris: z.array(z.string().url("Must be a valid URL.")).min(1, "At least one redirect URI is required."),
  allowedOrigins: z.array(z.string()).default([]),
  isFirstParty: z.boolean().default(true),
  isConfidential: z.boolean().default(false),
});

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const clients = await prisma.oAuthClient.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        allowedOrigins: true,
        isFirstParty: true,
        clientSecretHash: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            authorizationCodes: true,
            refreshTokens: true,
          },
        },
      },
    });

    const formatted = clients.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      name: c.name,
      redirectUris: c.redirectUris,
      allowedOrigins: c.allowedOrigins,
      isFirstParty: c.isFirstParty,
      isConfidential: Boolean(c.clientSecretHash),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      stats: {
        totalCodes: c._count.authorizationCodes,
        activeRefreshTokens: c._count.refreshTokens,
      },
    }));

    return NextResponse.json({ clients: formatted });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const session = await requireRole(["ADMIN"]);
    const body = await req.json();
    const parseResult = createClientSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { clientId, name, redirectUris, allowedOrigins, isFirstParty, isConfidential } = parseResult.data;

    const existing = await prisma.oAuthClient.findUnique({
      where: { clientId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An OAuth application with this Client ID already exists." },
        { status: 409 }
      );
    }

    let rawClientSecret: string | null = null;
    let clientSecretHash: string | null = null;

    if (isConfidential) {
      rawClientSecret = `avy_sec_${crypto.randomBytes(24).toString("hex")}`;
      clientSecretHash = await hashPassword(rawClientSecret);
    }

    const client = await prisma.oAuthClient.create({
      data: {
        clientId,
        name,
        redirectUris,
        allowedOrigins,
        isFirstParty,
        clientSecretHash,
      },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "ROLE_GRANTED",
      ipAddress: ip,
      metadata: { action: "oauth_client_created", clientId, name },
    });

    return NextResponse.json(
      {
        message: "OAuth application registered successfully.",
        client: {
          id: client.id,
          clientId: client.clientId,
          name: client.name,
          redirectUris: client.redirectUris,
          allowedOrigins: client.allowedOrigins,
          isFirstParty: client.isFirstParty,
          isConfidential,
          createdAt: client.createdAt,
        },
        rawClientSecret, // Returned ONLY ONCE upon creation
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create OAuth application." },
      { status: 500 }
    );
  }
}
