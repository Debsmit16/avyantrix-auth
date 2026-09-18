import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username.toLowerCase();

    const profile = await prisma.userProfile.findUnique({
      where: { username },
      include: {
        user: {
          include: {
            verificationBadges: { where: { isActive: true } },
          },
        },
      },
    });

    if (!profile || !profile.user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const badges = profile.user.verificationBadges;
    const isVerified = badges.length > 0;
    const statusText = isVerified ? (badges[0]?.badgeLabel || "Verified") : "Registered";
    const statusColor = isVerified ? "#10B981" : "#71717A";

    const leftWidth = 85;
    const rightWidth = Math.max(statusText.length * 8 + 20, 80);
    const totalWidth = leftWidth + rightWidth;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" viewBox="0 0 ${totalWidth} 24">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="24" rx="4" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#18181B" d="M0 0h${leftWidth}v24H0z"/>
    <path fill="${statusColor}" d="M${leftWidth} 0h${rightWidth}v24H${leftWidth}z"/>
    <path fill="url(#b)" d="M0 0h${totalWidth}v24H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" font-weight="700">
    <text x="${leftWidth / 2}" y="16" fill="#A1A1AA">Avyantrix ID</text>
    <text x="${leftWidth + rightWidth / 2}" y="16">${statusText}</text>
  </g>
</svg>
    `.trim();

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (error) {
    return new NextResponse("Error generating badge", { status: 500 });
  }
}
