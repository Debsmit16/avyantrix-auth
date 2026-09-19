import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createAppSchema = z.object({
  name: z.string().min(2, "Application name must be at least 2 characters").max(100),
  redirectUris: z.array(z.string().url("Must be a valid URL")).min(1, "At least one redirect URI is required"),
  allowedOrigins: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const apps = await prisma.oAuthClient.findMany({
      where: { ownerUserId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        allowedOrigins: true,
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

    return NextResponse.json({ apps });
  } catch (error) {
    console.error("Developer apps fetch error:", error);
    return NextResponse.json({ error: "Failed to retrieve developer applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createAppSchema.parse(body);

    // Generate unique client ID: app_ + 16 random hex
    const generatedClientId = `app_${crypto.randomBytes(8).toString("hex")}`;

    // Generate high-entropy 256-bit client secret
    const rawSecret = `avy_sec_${crypto.randomBytes(24).toString("hex")}`;
    const secretHash = await hashPassword(rawSecret);

    const newApp = await prisma.oAuthClient.create({
      data: {
        clientId: generatedClientId,
        clientSecretHash: secretHash,
        name: validated.name,
        redirectUris: validated.redirectUris,
        allowedOrigins: validated.allowedOrigins,
        isFirstParty: false,
        ownerUserId: session.userId,
      },
    });

    await logSecurityEvent({
      userId: session.userId,
      eventType: "DEVELOPER_APP_CREATED",
      metadata: {
        clientId: newApp.clientId,
        name: newApp.name,
      },
    });

    return NextResponse.json(
      {
        app: {
          id: newApp.id,
          clientId: newApp.clientId,
          name: newApp.name,
          redirectUris: newApp.redirectUris,
          createdAt: newApp.createdAt,
        },
        clientSecret: rawSecret,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Developer app create error:", error);
    return NextResponse.json({ error: "Failed to create developer application" }, { status: 500 });
  }
}
