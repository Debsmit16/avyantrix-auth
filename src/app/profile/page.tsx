"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Lock,
  Eye,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();

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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?next=/profile");
      return;
    }

    if (user) {
      fetch("/api/v1/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user && data.user.profile) {
            const p = data.user.profile;
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
          }
        });
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

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
        setError(data.error || "Failed to update profile.");
      } else {
        setSuccess(true);
        await refreshSession();
      }
    } catch (err) {
      setError("Network error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Avyantrix ID Profile</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your unified identity, professional credentials, and privacy visibility controls
        </p>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-xs font-medium text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Profile changes successfully updated.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Identity Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
            Identity & Bio
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Bio & Engineering Focus
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Describe your technical background, projects built, and research interests..."
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Education & Location */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
            Education & Location
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Location
              </label>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Kolkata, India"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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
                <GraduationCap className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={formData.collegeUniversity}
                  onChange={(e) => setFormData({ ...formData, collegeUniversity: e.target.value })}
                  placeholder="Institute of Engineering & Management"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Links & Socials */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
            Proof Links & Profiles
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                GitHub URL
              </label>
              <div className="relative mt-1">
                <Github className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                LinkedIn URL
              </label>
              <div className="relative mt-1">
                <Linkedin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Portfolio / Research URL
              </label>
              <div className="relative mt-1">
                <Globe className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://yourportfolio.dev"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Controls */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-red-500" />
            Public Profile Privacy Controls
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            Control which fields are visible on your public Avyantrix ID profile card (`/u/{user?.username}`)
          </p>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
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

            <label className="flex items-center justify-between cursor-pointer">
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

            <label className="flex items-center justify-between cursor-pointer">
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

            <label className="flex items-center justify-between cursor-pointer">
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-zinc-950 py-2.5 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
