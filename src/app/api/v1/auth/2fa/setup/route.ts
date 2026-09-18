import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { generateTotpSecret, getOtpAuthUri } from "@/lib/auth/totp";
import { generateQrCodeSvg } from "@/lib/auth/qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await requireAuth();
    const secret = generateTotpSecret();
    const otpAuthUri = getOtpAuthUri(session.email, secret, "Avyantrix ID");
    const qrCodeSvg = generateQrCodeSvg(otpAuthUri);

    return NextResponse.json({
      secret,
      otpAuthUri,
      qrCodeSvg,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}
