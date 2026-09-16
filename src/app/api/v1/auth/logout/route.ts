import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to logout cleanly." },
      { status: 500 }
    );
  }
}
