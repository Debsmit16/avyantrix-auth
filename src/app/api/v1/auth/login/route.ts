import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { logLoginEvent } from "@/lib/auth/audit";
import { sign2faToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid credentials." },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: 5 failed attempts per 15 minutes per IP & email
    const rateCheck = await checkRateLimit(`login:${ip}:${normalizedEmail}`, 5, 900);
    if (!rateCheck.success) {
      await logLoginEvent({
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        status: "FAILED",
        failureReason: "Rate limit exceeded (too many failed attempts)",
      });
      return NextResponse.json(
        { error: "Too many failed login attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // Lookup user in Neon PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      await logLoginEvent({
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        status: "FAILED",
        failureReason: "Invalid email or password",
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify Argon2id password hash
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      await logLoginEvent({
        userId: user.id,
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        status: "FAILED",
        failureReason: "Invalid password",
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === "SUSPENDED") {
      await logLoginEvent({
        userId: user.id,
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        status: "FAILED",
        failureReason: "Account suspended",
      });
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact Avyantrix support." },
        { status: 403 }
      );
    }

    // If 2FA is enabled, issue a temporary challenge token instead of creating full session
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const tempToken = sign2faToken(user.id);
      return NextResponse.json({
        requires2FA: true,
        tempToken,
        email: user.email,
        message: "Two-factor authentication code required.",
      });
    }

    // Create authoritative PostgreSQL session & set HttpOnly cookie
    await createSession({
      userId: user.id,
      ipAddress: ip,
      userAgent,
      deviceInfo: userAgent.substring(0, 100),
    });

    // Log successful login
    await logLoginEvent({
      userId: user.id,
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      status: "SUCCESS",
    });

    // Extract roles and distinct permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissionsSet.add(rp.permission.name);
      });
    });

    return NextResponse.json({
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        username: user.profile?.username,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        avatarUrl: user.profile?.avatarUrl,
        roles,
        permissions: Array.from(permissionsSet),
      },
    });
  } catch (error) {
    console.error("Login error:", (error as Error).message);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
