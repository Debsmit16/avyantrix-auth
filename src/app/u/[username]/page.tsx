import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shield, CheckCircle2, MapPin, GraduationCap, Github, Linkedin, Globe, Mail, Award, Calendar, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getPublicProfile(username: string) {
  try {
    const normalizedUsername = username.toLowerCase().trim();
    const profile = await prisma.userProfile.findUnique({
      where: { username: normalizedUsername },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
            userSkills: {
              include: {
                skill: true,
              },
            },
            verificationBadges: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!profile || profile.user.status !== "ACTIVE") {
      return null;
    }

    const visibility = (profile.visibilitySettings as any) || {
      show_email: false,
      show_education: true,
      show_location: true,
      show_links: true,
    };

    return {
      id: profile.user.id,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      headline: profile.headline,
      bio: profile.bio,
      location: visibility.show_location ? profile.location : null,
      collegeUniversity: visibility.show_education ? profile.collegeUniversity : null,
      graduationYear: visibility.show_education ? profile.graduationYear : null,
      currentStatus: profile.currentStatus,
      email: visibility.show_email ? profile.user.email : null,
      links: visibility.show_links
        ? {
            linkedin: profile.linkedinUrl,
            github: profile.githubUrl,
            portfolio: profile.portfolioUrl,
          }
        : null,
      roles: profile.user.userRoles.map((ur) => ur.role.name),
      skills: profile.user.userSkills.map((us) => ({
        name: us.skill.name,
        category: us.skill.category,
        proficiencyLevel: us.proficiencyLevel,
        isVerified: us.isVerified,
      })),
      verifiedBadges: profile.user.verificationBadges.map((b) => ({
        category: b.category,
        badgeLabel: b.badgeLabel,
        issuedAt: b.issuedAt,
      })),
      joinedAt: profile.user.createdAt,
    };
  } catch (err) {
    console.error("Public profile fetch error:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const profile = await getPublicProfile(params.username);
  if (!profile) {
    return { title: "Profile Not Found | Avyantrix Auth" };
  }
  return {
    title: `${profile.firstName} ${profile.lastName} (@${profile.username})`,
    description: profile.headline || `${profile.firstName}'s verified Avyantrix Builder profile.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getPublicProfile(params.username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-md">
        {/* Cover Header Banner */}
        <div className="h-32 bg-gradient-to-r from-zinc-900 via-zinc-800 to-red-950 p-6 flex items-start justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
            <Shield className="h-3.5 w-3.5 text-red-500" />
            <span>Avyantrix ID</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-300">
            ID: {profile.id.substring(0, 8)}
          </span>
        </div>

        {/* Profile Card Body */}
        <div className="relative px-6 pb-8 pt-0">
          {/* Avatar & Basic Info */}
          <div className="-mt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.firstName}
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-sm dark:border-zinc-900"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-zinc-950 text-2xl font-bold text-white shadow-sm dark:border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950">
                  {profile.firstName[0]}
                  {profile.lastName[0] || ""}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {profile.firstName} {profile.lastName}
                  </h1>
                </div>
                <p className="text-xs font-mono text-red-600 dark:text-red-400 font-medium">
                  @{profile.username}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {profile.roles.map((role: string) => {
                const isRoleVerified =
                  role === "ADMIN" ||
                  profile.verifiedBadges?.some((b: any) => {
                    if (role === "BUILDER") return b.category === "CAPABILITY_BUILDER";
                    return b.category === role;
                  });

                return (
                  <span
                    key={role}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${
                      role === "ADMIN"
                        ? "border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : isRoleVerified
                        ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
                    }`}
                  >
                    {isRoleVerified ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="h-3 w-3 text-amber-500" />
                    )}
                    {role} {isRoleVerified ? "(Verified)" : "(Unverified)"}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Headline & Bio */}
          <div className="mt-6 space-y-3">
            {profile.headline && (
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {profile.headline}
              </p>
            )}
            {profile.bio && (
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-line bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Metadata Chips */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-500 border-t border-b border-zinc-100 dark:border-zinc-800 py-3.5">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.collegeUniversity && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
                <span>
                  {profile.collegeUniversity}
                  {profile.graduationYear ? ` ('${String(profile.graduationYear).slice(-2)})` : ""}
                </span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-400" />
                <span>{profile.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Joined {formatDate(profile.joinedAt)}</span>
            </div>
          </div>

          {/* Verified Badges */}
          {profile.verifiedBadges && profile.verifiedBadges.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-red-500" />
                Verified Capabilities
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.verifiedBadges.map((b: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-1.5 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
                    <span>{b.badgeLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Technical Domains & Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s: any, idx: number) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {profile.links && (
            <div className="mt-8 flex flex-wrap gap-3">
              {profile.links.github && (
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 shadow-2xs transition-colors"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub Profile
                </a>
              )}
              {profile.links.linkedin && (
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 shadow-2xs transition-colors"
                >
                  <Linkedin className="h-3.5 w-3.5 text-blue-600" /> LinkedIn
                </a>
              )}
              {profile.links.portfolio && (
                <a
                  href={profile.links.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 shadow-2xs transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" /> Portfolio
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
