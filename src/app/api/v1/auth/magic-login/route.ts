import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { createMagicLoginToken, verifyMagicLoginToken } from "@/lib/auth/tokens";
import { sendMagicLinkEmail } from "@/lib/mail/mailer";
import { createSession } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // Rate limit: 5 magic link requests per 15 minutes per IP
    const rateCheck = await checkRateLimit(`magic-login-req:${ip}`, 5, 900);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many magic link requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid email." },
        { status: 400 }
      );
    }

    const normalizedEmail = parseResult.data.email.toLowerCase().trim();

    // Look up user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    // Always respond with success to prevent user enumeration
    if (user && user.status === "ACTIVE") {
      const token = await createMagicLoginToken(user.id);
      await sendMagicLinkEmail(
        user.email,
        user.profile?.firstName || user.profile?.username || "Builder",
        token
      );

      await logSecurityEvent({
        userId: user.id,
        eventType: "VERIFICATION_SUBMITTED",
        ipAddress: ip,
        metadata: { action: "magic_link_requested", email: normalizedEmail },
      });
    }

    return NextResponse.json({
      message: "If an account exists with this email address, a secure sign-in link has been sent.",
    });
  } catch (error) {
    console.error("Magic link request error:", (error as Error).message);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (!token) {
      return NextResponse.json(
        { error: "Missing required token parameter." },
        { status: 400 }
      );
    }

    // Rate limit token verification attempts
    const rateCheck = await checkRateLimit(`magic-login-verify:${ip}`, 10, 300);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 }
      );
    }

    const verification = await verifyMagicLoginToken(token);
    if (!verification.success || !verification.userId) {
      return NextResponse.json(
        { error: verification.error || "Invalid or expired magic login link." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account is disabled or inactive." },
        { status: 403 }
      );
    }

    // If email wasn't verified yet, mark it verified since user accessed their inbox
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    // Create session and set cookie
    const userAgent = req.headers.get("user-agent") || undefined;
    await createSession({ userId: user.id, ipAddress: ip, userAgent });

    await logSecurityEvent({
      userId: user.id,
      eventType: "ROLE_GRANTED",
      ipAddress: ip,
      metadata: { action: "magic_login_success", email: user.email },
    });

    // Record login event
    await prisma.loginEvent.create({
      data: {
        userId: user.id,
        email: user.email,
        ipAddress: ip,
        userAgent,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully signed in via magic link.",
      redirect: "/dashboard",
    });
  } catch (error) {
    console.error("Magic login exchange error:", (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message || "Magic login exchange failed." },
      { status: 500 }
    );
  }
}
