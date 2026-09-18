import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { generateTotpSecret, getOtpAuthUri } from "@/lib/auth/totp";
import { generateQrCodeSvg, generateQrCodeDataUrl } from "@/lib/auth/qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await requireAuth();
    const secret = generateTotpSecret();
    const otpAuthUri = getOtpAuthUri(session.email, secret, "Avyantrix ID");
    const [qrCodeSvg, qrCodeDataUrl] = await Promise.all([
      generateQrCodeSvg(otpAuthUri),
      generateQrCodeDataUrl(otpAuthUri),
    ]);

    return NextResponse.json({
      secret,
      otpAuthUri,
      qrCodeSvg,
      qrCodeDataUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status: 401 }
    );
  }
}
