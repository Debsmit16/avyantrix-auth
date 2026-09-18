import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VerificationCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { createEmailVerificationToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/mail/mailer";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { logSecurityEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be at most 30 characters.")
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, hyphens, and underscores."),
  firstName: z.string().min(1, "First name is required.").max(100),
  lastName: z.string().min(1, "Last name is required.").max(100),
  password: z.string().min(12, "Password must be at least 12 characters."),
  intendedRole: z.enum(["BUILDER", "MENTOR", "PROBLEM_OWNER", "CHALLENGE_ORGANIZER"]).optional().default("BUILDER"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    
    // Rate limit: 5 registrations per hour per IP
    const rateCheck = await checkRateLimit(`register:${ip}`, 5, 3600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { email, username, firstName, lastName, password, intendedRole } = parseResult.data;

    // Validate Argon2id password complexity
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    // Check email uniqueness
    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Check username uniqueness
    const normalizedUsername = username.toLowerCase().trim();
    const existingUsername = await prisma.userProfile.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Hash password strictly with Argon2id
    const passwordHash = await hashPassword(password);

    // Get selected persona role
    const targetRole = await prisma.role.findUnique({
      where: { name: intendedRole },
    });

    // Create user, profile, selected role, and initial pending verification request in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          emailVerified: false,
          status: "ACTIVE",
        },
      });

      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          username: normalizedUsername,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      });

      // Assign ONLY the selected persona role
      if (targetRole) {
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: targetRole.id,
          },
        });
      }

      // If user registered with a specific track (Mentor, Problem Owner, Organizer),
      // create initial queue entry in verification lineup with PENDING status
      if (intendedRole !== "BUILDER") {
        await tx.verificationRequest.create({
          data: {
            userId: newUser.id,
            category: intendedRole as VerificationCategory,
            status: "PENDING",
            notes: `[AUTO-INTENT] User registered with primary persona: ${intendedRole}. Status: Unverified (Awaiting verification details & admin review).`,
          },
        });
      }

      return newUser;
    });

    // Generate email verification token and send email
    const verificationToken = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(normalizedEmail, firstName, verificationToken);

    await logSecurityEvent({
      userId: user.id,
      eventType: "VERIFICATION_SUBMITTED",
      ipAddress: ip,
      metadata: { action: "user_registered", email: normalizedEmail, intendedRole },
    });

    return NextResponse.json(
      {
        message: "Registration successful. Please check your email to verify your Avyantrix ID.",
        userId: user.id,
        intendedRole,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", (error as Error).message);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
