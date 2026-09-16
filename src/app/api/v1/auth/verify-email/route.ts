import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailToken } from "@/lib/auth/tokens";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const verifySchema = z.object({
  token: z.string().min(1, "Verification token is required."),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const body = await req.json();
    const parseResult = verifySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    const { token } = parseResult.data;
    const result = await verifyEmailToken(token);

    if (!result.success || !result.userId) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    await logSecurityEvent({
      userId: result.userId,
      eventType: "EMAIL_VERIFIED",
      ipAddress: ip,
    });

    return NextResponse.json({
      message: "Email address verified successfully. Your Avyantrix ID is now active.",
    });
  } catch (error) {
    console.error("Email verification error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to verify email address." },
      { status: 500 }
    );
  }
}
