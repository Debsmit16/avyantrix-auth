import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { createEmailVerificationToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/mail/mailer";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  try {
    const session = await getSession();
    let userEmail = session?.email;
    let userId = session?.userId;
    let firstName = session?.firstName || "Builder";

    if (!userEmail) {
      const body = await req.json().catch(() => ({}));
      if (body.email) {
        const user = await prisma.user.findUnique({
          where: { email: body.email.toLowerCase().trim() },
          include: { profile: true },
        });
        if (user) {
          userEmail = user.email;
          userId = user.id;
          firstName = user.profile?.firstName || "Builder";
        }
      }
    }

    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: "Account not found or email required." },
        { status: 400 }
      );
    }

    // Rate limit resend to 3 per hour
    const rateCheck = await checkRateLimit(`resend:${ip}:${userEmail}`, 3, 3600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before requesting another verification email." },
        { status: 429 }
      );
    }

    const token = await createEmailVerificationToken(userId);
    await sendVerificationEmail(userEmail, firstName, token);

    return NextResponse.json({
      message: "Verification email dispatched.",
    });
  } catch (error) {
    console.error("Resend verification error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to resend verification email." },
      { status: 500 }
    );
  }
}
