"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Globe,
  Github,
  Linkedin,
  GraduationCap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Pencil,
  X,
  ExternalLink,
  Mail,
  Shield,
  Award,
  Calendar,
  Sparkles,
  Check,
} from "lucide-react";
import { ProfileShareButtons } from "@/components/profile/ProfileShareButtons";
import { getAvatarDataUrl } from "@/lib/avatar";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    location: "",
    collegeUniversity: "",
    graduationYear: "",
    currentStatus: "Engineer",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    visibilitySettings: {
      show_email: false,
      show_education: true,
      show_location: true,
      show_links: true,
    },
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const populateForm = (p: any) => {
    setFormData({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      headline: p.headline || "",
      bio: p.bio || "",
      location: p.location || "",
      collegeUniversity: p.collegeUniversity || "",
      graduationYear: p.graduationYear ? String(p.graduationYear) : "",
      currentStatus: p.currentStatus || "Engineer",
      linkedinUrl: p.linkedinUrl || "",
      githubUrl: p.githubUrl || "",
      portfolioUrl: p.portfolioUrl || "",
      visibilitySettings: p.visibilitySettings || {
        show_email: false,
        show_education: true,
        show_location: true,
        show_links: true,
      },
    });
  };

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/v1/me");
      const data = await res.json();
      if (data.user) {
        setProfileData(data.user);
        if (data.user.profile) {
          populateForm(data.user.profile);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?next=/profile");
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, loading, router]);

  const handleCancelEdit = () => {
    if (profileData?.profile) {
      populateForm(profileData.profile);
    }
    setErrorMsg("");
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        ...formData,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear, 10) : null,
      };

      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update profile.");
      } else {
        setSuccessMsg("Profile successfully updated!");
        await loadProfile();
        await refreshSession();
        setIsEditing(false);
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setErrorMsg("Network error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || (!profileData && user)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  const p = profileData?.profile || {};
  const username = p.username || user?.username || "builder";
  const fullName = `${p.firstName || user?.firstName || "Builder"} ${p.lastName || user?.lastName || ""}`.trim();
  const avatarSrc = p.avatarUrl || user?.avatarUrl || getAvatarDataUrl(fullName, username, 160);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Alerts */}
      {successMsg && (
        <div className="mb-6 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-600 dark:text-emerald-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-50/80 p-4 text-xs font-semibold text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-600 dark:text-red-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Profile Header Container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-md mb-8">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 p-6 flex items-start justify-between relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
            <Shield className="h-3.5 w-3.5 text-red-500" />
            <span>Avyantrix Central ID</span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            ID: {profileData?.id ? profileData.id.substring(0, 8) : "avy-user"}
          </span>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 pb-6 pt-0">
          <div className="-mt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <img
                src={avatarSrc}
                alt={fullName}
                className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md dark:border-zinc-900 bg-black"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {fullName}
                  </h1>
                </div>
                <p className="text-xs font-mono text-red-600 dark:text-red-400 font-semibold">
                  @{username}
                </p>
              </div>
            </div>

            {/* Action Buttons: Edit / View Public */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <>
                  <Link
                    href={`/u/${username}`}
                    target="_blank"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 shadow-2xs transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Public Card</span>
                  </Link>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: READ-ONLY PREVIEW MODE (DEFAULT)                                 */}
      {/* ========================================================================= */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Identity & Bio Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-red-500" />
                About & Engineering Focus
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            </div>

            {p.headline ? (
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                {p.headline}
              </p>
            ) : (
              <p className="text-xs italic text-zinc-400 dark:text-zinc-500 mb-3">
                No professional headline added yet.
              </p>
            )}

            {p.bio ? (
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-line bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                {p.bio}
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <p className="text-xs text-zinc-400">No bio provided yet. Click "Edit Profile" to introduce yourself.</p>
              </div>
            )}
          </div>

          {/* Credentials, Education & Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Professional & Academic Information */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-red-500" />
                Credentials & Background
              </h2>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Current Track / Status</span>
                  <span className="font-semibold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                    {p.currentStatus || "Engineer"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Location</span>
                  <span className="font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {p.location || "Not specified"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">College / Institution</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {p.collegeUniversity || "Not specified"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Graduation Year</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {p.graduationYear || "Not specified"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-zinc-500">Primary Email</span>
                  <span className="font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    {profileData?.email}
                    {profileData?.emailVerified && (
                      <span title="Verified Email">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Connected Links & Socials */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-red-500" />
                  Proof Links & Profiles
                </h2>

                <div className="space-y-3">
                  {p.githubUrl ? (
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        <span>GitHub Profile</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                      <Github className="h-4 w-4" />
                      <span>No GitHub linked</span>
                    </div>
                  )}

                  {p.linkedinUrl ? (
                    <a
                      href={p.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-blue-500" />
                        <span>LinkedIn Profile</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                      <Linkedin className="h-4 w-4" />
                      <span>No LinkedIn linked</span>
                    </div>
                  )}

                  {p.portfolioUrl ? (
                    <a
                      href={p.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-red-500" />
                        <span>Portfolio / Demo Website</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                      <Globe className="h-4 w-4" />
                      <span>No Portfolio website linked</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Summary Badge */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Public Privacy:</span>
                <span className="font-mono text-zinc-500">
                  {p.visibilitySettings?.show_email ? "Email visible" : "Email hidden"} •{" "}
                  {p.visibilitySettings?.show_location !== false ? "Location visible" : "Location hidden"}
                </span>
              </div>
            </div>
          </div>

          {/* Social Share & Markdown Badge Widget */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <ProfileShareButtons
              username={username}
              fullName={fullName}
              headline={p.headline}
            />
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: INTERACTIVE EDIT FORM MODE                                        */
        /* ========================================================================= */
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
          {/* Identity & Bio Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Identity & Bio
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Embedded Systems Engineer | TinyML Researcher"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Bio & Engineering Focus
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your technical background, projects built, and research interests..."
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Education & Location Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Education & Location
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Location
                </label>
                <div className="relative mt-1">
                  <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Kolkata, India"
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Current Status
                </label>
                <select
                  value={formData.currentStatus}
                  onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Engineer">Engineer / Developer</option>
                  <option value="Student">Student / Researcher</option>
                  <option value="Founder">Founder / Problem Owner</option>
                  <option value="Mentor">Mentor / Academic Advisor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  College / University
                </label>
                <div className="relative mt-1">
                  <GraduationCap className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={formData.collegeUniversity}
                    onChange={(e) => setFormData({ ...formData, collegeUniversity: e.target.value })}
                    placeholder="Institute of Engineering & Management"
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Graduation Year
                </label>
                <input
                  type="number"
                  min={1970}
                  max={2035}
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  placeholder="2026"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Links & Socials Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Proof Links & Profiles
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  GitHub Profile URL
                </label>
                <div className="relative mt-1">
                  <Github className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  LinkedIn Profile URL
                </label>
                <div className="relative mt-1">
                  <Linkedin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Portfolio / Research Website URL
                </label>
                <div className="relative mt-1">
                  <Globe className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    placeholder="https://yourportfolio.dev"
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Public Profile Privacy Controls Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-red-500" />
              Public Profile Privacy Controls
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Choose which fields are displayed on your public profile card (`/u/{username}`)
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Show Email Address</span>
                <input
                  type="checkbox"
                  checked={formData.visibilitySettings.show_email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visibilitySettings: { ...formData.visibilitySettings, show_email: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Show Education Details</span>
                <input
                  type="checkbox"
                  checked={formData.visibilitySettings.show_education}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visibilitySettings: { ...formData.visibilitySettings, show_education: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Show Location</span>
                <input
                  type="checkbox"
                  checked={formData.visibilitySettings.show_location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visibilitySettings: { ...formData.visibilitySettings, show_location: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Show Portfolio & Social Links</span>
                <input
                  type="checkbox"
                  checked={formData.visibilitySettings.show_links}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visibilitySettings: { ...formData.visibilitySettings, show_links: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-zinc-200 bg-white py-2.5 px-5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-red-600 py-2.5 px-6 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-600/20 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
