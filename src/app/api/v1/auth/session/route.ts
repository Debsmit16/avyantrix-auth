import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, session: null }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        id: session.id,
        userId: session.userId,
        email: session.email,
        emailVerified: session.emailVerified,
        username: session.username,
        firstName: session.firstName,
        lastName: session.lastName,
        avatarUrl: session.avatarUrl,
        status: session.status,
        roles: session.roles,
        permissions: session.permissions,
      },
    });
  } catch (error) {
    console.error("Session introspection error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to retrieve session." },
      { status: 500 }
    );
  }
}
