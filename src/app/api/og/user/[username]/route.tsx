import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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
            userRoles: { include: { role: true } },
            verificationBadges: { where: { isActive: true } },
            userSkills: { include: { skill: true } },
          },
        },
      },
    });

    if (!profile || !profile.user) {
      return new Response("User not found", { status: 404 });
    }

    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    const headline = profile.headline || "Avyantrix ID Member";
    const badges = profile.user.verificationBadges;
    const skills = profile.user.userSkills.slice(0, 4).map((s) => s.skill.name);
    const isVerified = badges.length > 0;
    const topBadge = badges[0]?.badgeLabel || (isVerified ? "Verified" : "Member");

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#09090b",
            backgroundImage: "radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #27272a 2%, transparent 0%)",
            backgroundSize: "100px 100px",
            color: "#ffffff",
            padding: "60px 80px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#ffffff",
                }}
              >
                A
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "-0.5px" }}>
                AVYANTRIX<span style={{ color: "#ef4444" }}>.</span> ID
              </div>
            </div>

            {isVerified && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: "9999px",
                  padding: "8px 20px",
                  color: "#34d399",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                ✓ {topBadge}
              </div>
            )}
          </div>

          {/* User Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "52px", fontWeight: "bold", letterSpacing: "-1.5px", color: "#ffffff" }}>
              {fullName}
            </div>
            <div style={{ fontSize: "22px", color: "#a1a1aa", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>@{profile.username}</span>
              <span>&bull;</span>
              <span>{headline}</span>
            </div>

            {skills.length > 0 && (
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                {skills.map((skill) => (
                  <div
                    key={skill}
                    style={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "14px",
                      color: "#d4d4d8",
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #27272a",
              paddingTop: "24px",
              fontSize: "14px",
              color: "#71717a",
            }}
          >
            <div>auth.avyantrix.com/u/{profile.username}</div>
            <div>Decentralized Engineering & Hardware Capability Registry</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Error generating image", { status: 500 });
  }
}
