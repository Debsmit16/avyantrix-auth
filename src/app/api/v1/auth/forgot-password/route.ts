import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/mail/mailer";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const body = await req.json();
    const parseResult = forgotSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: 3 reset requests per hour per IP & email
    const rateCheck = await checkRateLimit(`forgot:${ip}:${normalizedEmail}`, 3, 3600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please wait an hour before requesting again." },
        { status: 429 }
      );
    }

    // Always respond with success to prevent user enumeration attacks
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (user && user.status === "ACTIVE") {
      const resetToken = await createPasswordResetToken(user.id);
      const recipientName = user.profile?.firstName || "Builder";
      await sendPasswordResetEmail(normalizedEmail, recipientName, resetToken);

      await logSecurityEvent({
        userId: user.id,
        eventType: "PASSWORD_RESET_REQUESTED",
        ipAddress: ip,
        metadata: { email: normalizedEmail },
      });
    }

    return NextResponse.json({
      message: "If an account exists with this email, a password reset link has been dispatched.",
    });
  } catch (error) {
    console.error("Forgot password error:", (error as Error).message);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
