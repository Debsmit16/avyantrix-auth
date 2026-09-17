"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  Shield,
  Clock,
  XCircle,
  Plus,
  Trash2,
  FileCode,
  Globe,
  Award,
  BookOpen,
  Loader2,
  AlertCircle,
  Code2,
  GraduationCap,
  Building2,
  Trophy,
  ExternalLink,
  Linkedin,
  Briefcase,
  Layers,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type TrackType = "CAPABILITY_BUILDER" | "MENTOR" | "PROBLEM_OWNER" | "CHALLENGE_ORGANIZER" | "EDUCATION" | "IDENTITY";

function VerificationContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [requests, setRequests] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Active track selection (default to query param if provided, otherwise BUILDER)
  const initialTrack = (searchParams.get("track") as TrackType) || "CAPABILITY_BUILDER";
  const [activeTrack, setActiveTrack] = useState<TrackType>(initialTrack);

  // Builder Evidence Form State
  const [builderNotes, setBuilderNotes] = useState("");
  const [builderEvidence, setBuilderEvidence] = useState<
    Array<{ evidenceType: string; title: string; evidenceUrl: string; description: string }>
  >([
    {
      evidenceType: "GITHUB_REPO",
      title: "Core Project Repository",
      evidenceUrl: "",
      description: "",
    },
  ]);

  // Mentor Application Form State
  const [mentorData, setMentorData] = useState({
    affiliation: "",
    jobTitle: "",
    yearsExperience: "5",
    primaryDomains: "Embedded Systems, TinyML & Edge AI",
    bio: "",
    linkedinUrl: "",
    scholarOrGithubUrl: "",
    portfolioUrl: "",
  });

  // Problem Owner Application Form State
  const [problemOwnerData, setProblemOwnerData] = useState({
    organizationName: "",
    orgType: "DeepTech Enterprise",
    industrySector: "Embedded Hardware & Systems",
    websiteUrl: "",
    officialContactRole: "",
    problemScopeDescription: "",
    proofUrl: "",
  });

  // Challenge Organizer Form State
  const [organizerData, setOrganizerData] = useState({
    communityName: "",
    entityType: "University Tech Club",
    pastEventsTrackRecord: "",
    proposedChallengeVision: "",
    communityUrl: "",
    proofDocumentUrl: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadVerificationData = async () => {
    try {
      const res = await fetch("/api/v1/verification/status");
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
      if (data.badges) setBadges(data.badges);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?next=/verification");
      return;
    }
    if (user) {
      loadVerificationData();
    }
  }, [user, loading, router]);

  // Builder Evidence Row Controls
  const addBuilderEvidenceRow = () => {
    setBuilderEvidence([
      ...builderEvidence,
      {
        evidenceType: "GITHUB_REPO",
        title: "",
        evidenceUrl: "",
        description: "",
      },
    ]);
  };

  const removeBuilderEvidenceRow = (index: number) => {
    if (builderEvidence.length <= 1) return;
    setBuilderEvidence(builderEvidence.filter((_, i) => i !== index));
  };

  const updateBuilderEvidence = (index: number, field: string, value: string) => {
    const updated = [...builderEvidence];
    updated[index] = { ...updated[index], [field]: value };
    setBuilderEvidence(updated);
  };

  // Submit Handler Dispatcher
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      let payloadCategory = activeTrack;
      let payloadNotes = "";
      let payloadEvidence: any[] = [];

      if (activeTrack === "CAPABILITY_BUILDER") {
        payloadNotes = builderNotes;
        payloadEvidence = builderEvidence;
      } else if (activeTrack === "MENTOR") {
        payloadNotes = `[MENTOR APPLICATION]\nAffiliation: ${mentorData.affiliation} (${mentorData.jobTitle})\nExperience: ${mentorData.yearsExperience} Years\nDomains: ${mentorData.primaryDomains}\nMentorship Statement: ${mentorData.bio}`;
        payloadEvidence = [
          {
            evidenceType: "PORTFOLIO",
            title: `LinkedIn Profile (${mentorData.affiliation})`,
            evidenceUrl: mentorData.linkedinUrl,
            description: `Professional Profile: ${mentorData.jobTitle} at ${mentorData.affiliation}`,
          },
        ];
        if (mentorData.scholarOrGithubUrl) {
          payloadEvidence.push({
            evidenceType: "RESEARCH_PAPER",
            title: "Scholar / GitHub / Research Profile",
            evidenceUrl: mentorData.scholarOrGithubUrl,
            description: "Research publications and open-source contributions",
          });
        }
        if (mentorData.portfolioUrl) {
          payloadEvidence.push({
            evidenceType: "CREDENTIAL_LINK",
            title: "Personal / Advisory Portfolio",
            evidenceUrl: mentorData.portfolioUrl,
            description: "Advisory tracks & speaking engagements",
          });
        }
      } else if (activeTrack === "PROBLEM_OWNER") {
        payloadNotes = `[PROBLEM OWNER VERIFICATION]\nOrganization: ${problemOwnerData.organizationName}\nType: ${problemOwnerData.orgType}\nSector: ${problemOwnerData.industrySector}\nContact Role: ${problemOwnerData.officialContactRole}\nProblem Brief Scope: ${problemOwnerData.problemScopeDescription}`;
        payloadEvidence = [
          {
            evidenceType: "DEPLOYED_URL",
            title: `${problemOwnerData.organizationName} Official Website`,
            evidenceUrl: problemOwnerData.websiteUrl,
            description: `Official enterprise portal for ${problemOwnerData.organizationName}`,
          },
        ];
        if (problemOwnerData.proofUrl) {
          payloadEvidence.push({
            evidenceType: "DOCUMENT_REFERENCE",
            title: "Corporate Verification / Domain Link",
            evidenceUrl: problemOwnerData.proofUrl,
            description: "Institutional domain registration / corporate proof",
          });
        }
      } else if (activeTrack === "CHALLENGE_ORGANIZER") {
        payloadNotes = `[CHALLENGE ORGANIZER APPLICATION]\nCommunity/Club: ${organizerData.communityName}\nType: ${organizerData.entityType}\nPast Events Track Record: ${organizerData.pastEventsTrackRecord}\nProposed Challenge Vision: ${organizerData.proposedChallengeVision}`;
        payloadEvidence = [
          {
            evidenceType: "PORTFOLIO",
            title: `${organizerData.communityName} Hub / Event Portal`,
            evidenceUrl: organizerData.communityUrl,
            description: "Community platform / past hackathon portfolio",
          },
        ];
        if (organizerData.proofDocumentUrl) {
          payloadEvidence.push({
            evidenceType: "DOCUMENT_REFERENCE",
            title: "Institutional / Organizer Endorsement",
            evidenceUrl: organizerData.proofDocumentUrl,
            description: "Proof of community leadership or institutional backing",
          });
        }
      }

      const res = await fetch("/api/v1/verification/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: payloadCategory,
          notes: payloadNotes,
          evidence: payloadEvidence,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit verification request.");
      } else {
        setSuccess("Verification request submitted successfully. It will be reviewed by the Avyantrix team.");
        setBuilderNotes("");
        loadVerificationData();
      }
    } catch (err) {
      setError("Network error submitting request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Role & Capability Verification Hub</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Prove your technical engineering proof, apply for mentor credentials, or verify your enterprise problem-owner and organizer status
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-xs font-medium text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Earned Badges Section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
          <Award className="h-4 w-4 text-red-500" />
          Active Verified Badges on Avyantrix ID
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Badges earned through verified engineering proof and institutional review, displayed on your public profile
        </p>

        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/60 px-3.5 py-2 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
              >
                <CheckCircle2 className="h-4 w-4 text-red-500" />
                <span>{b.badgeLabel}</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  ({formatDateTime(b.issuedAt)})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic">No verification badges issued yet.</p>
        )}
      </div>

      {/* Verification Track Selector */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
          Choose Verification Track
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Track 1: Builder */}
          <button
            type="button"
            onClick={() => setActiveTrack("CAPABILITY_BUILDER")}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeTrack === "CAPABILITY_BUILDER"
                ? "border-red-500 bg-red-50/40 shadow-sm dark:border-red-500/80 dark:bg-red-950/30"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Code2 className="h-5 w-5 text-red-500" />
              {activeTrack === "CAPABILITY_BUILDER" && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">Selected</span>
              )}
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-white">Builder Capability</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Verify code repositories, live systems, TinyML, and hardware proofs.
            </p>
          </button>

          {/* Track 2: Mentor */}
          <button
            type="button"
            onClick={() => setActiveTrack("MENTOR")}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeTrack === "MENTOR"
                ? "border-red-500 bg-red-50/40 shadow-sm dark:border-red-500/80 dark:bg-red-950/30"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="h-5 w-5 text-red-500" />
              {activeTrack === "MENTOR" && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">Selected</span>
              )}
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-white">Mentor Application</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Apply to guide builders, conduct technical reviews, and host office hours.
            </p>
          </button>

          {/* Track 3: Problem Owner */}
          <button
            type="button"
            onClick={() => setActiveTrack("PROBLEM_OWNER")}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeTrack === "PROBLEM_OWNER"
                ? "border-red-500 bg-red-50/40 shadow-sm dark:border-red-500/80 dark:bg-red-950/30"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-5 w-5 text-red-500" />
              {activeTrack === "PROBLEM_OWNER" && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">Selected</span>
              )}
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-white">Problem Owner</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Verify company/lab credentials to publish industrial problems & bounties.
            </p>
          </button>

          {/* Track 4: Organizer */}
          <button
            type="button"
            onClick={() => setActiveTrack("CHALLENGE_ORGANIZER")}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeTrack === "CHALLENGE_ORGANIZER"
                ? "border-red-500 bg-red-50/40 shadow-sm dark:border-red-500/80 dark:bg-red-950/30"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Trophy className="h-5 w-5 text-red-500" />
              {activeTrack === "CHALLENGE_ORGANIZER" && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">Selected</span>
              )}
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-white">Challenge Organizer</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Host hackathons, campus sprints, and community competitions.
            </p>
          </button>
        </div>
      </div>

      {/* Role-Specific Form Container */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TRACK 1: BUILDER CAPABILITY */}
          {activeTrack === "CAPABILITY_BUILDER" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-red-500" />
                  Builder Capability Verification Track
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Submit proof of code repositories, live deployed systems, or research DOIs. Evidence is kept strictly private for technical reviewer evaluation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Technical Overview / Summary of Contributions
                </label>
                <textarea
                  rows={3}
                  value={builderNotes}
                  onChange={(e) => setBuilderNotes(e.target.value)}
                  placeholder="Summarize the systems architecture, firmware stack, or algorithms you've authored..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              {/* Evidence Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Proof Links & Repositories ({builderEvidence.length})
                  </label>
                  <button
                    type="button"
                    onClick={addBuilderEvidenceRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Another Proof
                  </button>
                </div>

                {builderEvidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Proof #{idx + 1}
                      </span>
                      {builderEvidence.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBuilderEvidenceRow(idx)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Evidence Type
                        </label>
                        <select
                          value={item.evidenceType}
                          onChange={(e) => updateBuilderEvidence(idx, "evidenceType", e.target.value)}
                          className="mt-1 w-full rounded-md border border-zinc-200 bg-white py-1.5 px-2.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        >
                          <option value="GITHUB_REPO">GitHub / GitLab Repository</option>
                          <option value="DEPLOYED_URL">Live Deployed URL / System Demo</option>
                          <option value="RESEARCH_PAPER">Research Paper / DOI Reference</option>
                          <option value="CERTIFICATE">Official Certificate / Credential</option>
                          <option value="PORTFOLIO">Portfolio / Case Study</option>
                          <option value="DOCUMENT_REFERENCE">Technical Documentation</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Title / Name of Artifact
                        </label>
                        <input
                          type="text"
                          required
                          value={item.title}
                          onChange={(e) => updateBuilderEvidence(idx, "title", e.target.value)}
                          placeholder="e.g. TinyML Spirometry Firmware"
                          className="mt-1 w-full rounded-md border border-zinc-200 bg-white py-1.5 px-2.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          URL Link (Repository, Publication, or Live Demo)
                        </label>
                        <input
                          type="url"
                          required
                          value={item.evidenceUrl}
                          onChange={(e) => updateBuilderEvidence(idx, "evidenceUrl", e.target.value)}
                          placeholder="https://github.com/organization/repository"
                          className="mt-1 w-full rounded-md border border-zinc-200 bg-white py-1.5 px-2.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRACK 2: MENTOR APPLICATION */}
          {activeTrack === "MENTOR" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-red-500" />
                  Mentor & Research Advisor Application Track
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Upon review and approval by the Avyantrix team, you will receive the Verified Mentor badge, access to the Mentor Cockpit, and permission to review builder solutions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Current Organization / Company / Lab
                  </label>
                  <input
                    type="text"
                    required
                    value={mentorData.affiliation}
                    onChange={(e) => setMentorData({ ...mentorData, affiliation: e.target.value })}
                    placeholder="e.g. Bosch Research / Stanford Med"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Professional Job Title / Role
                  </label>
                  <input
                    type="text"
                    required
                    value={mentorData.jobTitle}
                    onChange={(e) => setMentorData({ ...mentorData, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Principal Embedded Engineer"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Years of Relevant Technical/Research Experience
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={mentorData.yearsExperience}
                    onChange={(e) => setMentorData({ ...mentorData, yearsExperience: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Primary Mentoring Domains & Disciplines
                  </label>
                  <input
                    type="text"
                    required
                    value={mentorData.primaryDomains}
                    onChange={(e) => setMentorData({ ...mentorData, primaryDomains: e.target.value })}
                    placeholder="e.g. TinyML, Embedded C++, Medical Sensors, FPGA"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Mentorship Bio & Guiding Statement
                </label>
                <textarea
                  rows={3}
                  required
                  value={mentorData.bio}
                  onChange={(e) => setMentorData({ ...mentorData, bio: e.target.value })}
                  placeholder="Describe your background, areas you want to guide builders in, and how you approach technical reviews..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    required
                    value={mentorData.linkedinUrl}
                    onChange={(e) => setMentorData({ ...mentorData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/yourname"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Google Scholar / GitHub / Research Profile (Optional)
                  </label>
                  <input
                    type="url"
                    value={mentorData.scholarOrGithubUrl}
                    onChange={(e) => setMentorData({ ...mentorData, scholarOrGithubUrl: e.target.value })}
                    placeholder="https://scholar.google.com/citations?user=..."
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TRACK 3: PROBLEM OWNER VERIFICATION */}
          {activeTrack === "PROBLEM_OWNER" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-red-500" />
                  Problem Owner & Enterprise Sponsor Verification Track
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  For corporations, venture research labs, clinical partners, and startups seeking to submit real-world hardware & deep-tech problem statements to verified Avyantrix builders.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Organization / Company / Lab Name
                  </label>
                  <input
                    type="text"
                    required
                    value={problemOwnerData.organizationName}
                    onChange={(e) => setProblemOwnerData({ ...problemOwnerData, organizationName: e.target.value })}
                    placeholder="e.g. AeroSys Diagnostics Lab"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Industry Sector & Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={problemOwnerData.industrySector}
                    onChange={(e) => setProblemOwnerData({ ...problemOwnerData, industrySector: e.target.value })}
                    placeholder="e.g. Medical Devices, Aerospace, Edge AI"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    required
                    value={problemOwnerData.websiteUrl}
                    onChange={(e) => setProblemOwnerData({ ...problemOwnerData, websiteUrl: e.target.value })}
                    placeholder="https://company.com"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Your Official Role at Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={problemOwnerData.officialContactRole}
                    onChange={(e) => setProblemOwnerData({ ...problemOwnerData, officialContactRole: e.target.value })}
                    placeholder="e.g. Head of R&D / Lead Product Architect"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Intended Problem Statement Scope & Challenge Overview
                </label>
                <textarea
                  rows={3}
                  required
                  value={problemOwnerData.problemScopeDescription}
                  onChange={(e) => setProblemOwnerData({ ...problemOwnerData, problemScopeDescription: e.target.value })}
                  placeholder="Outline the real-world engineering challenge, hardware bottlenecks, or clinical problem statements you plan to publish..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Verification Proof Link (LinkedIn Company Page, Corporate Registry, or Work Verification)
                </label>
                <input
                  type="url"
                  value={problemOwnerData.proofUrl}
                  onChange={(e) => setProblemOwnerData({ ...problemOwnerData, proofUrl: e.target.value })}
                  placeholder="https://linkedin.com/company/organization"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* TRACK 4: CHALLENGE ORGANIZER */}
          {activeTrack === "CHALLENGE_ORGANIZER" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-red-500" />
                  Challenge Organizer & Community Host Application Track
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  For university technical chapters, dev communities, and hackathon organizers to host verified competitive sprints and manage scoring rubrics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Community / University Chapter / Club Name
                  </label>
                  <input
                    type="text"
                    required
                    value={organizerData.communityName}
                    onChange={(e) => setOrganizerData({ ...organizerData, communityName: e.target.value })}
                    placeholder="e.g. IEEE Student Branch / AI Collective"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Organization Type
                  </label>
                  <select
                    value={organizerData.entityType}
                    onChange={(e) => setOrganizerData({ ...organizerData, entityType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="University Tech Club">University Tech Club / Chapter</option>
                    <option value="Developer Community">Developer Community / DAO</option>
                    <option value="Incubator / Accelerator">Incubator / Accelerator</option>
                    <option value="Corporate Hackathon Partner">Corporate Hackathon Partner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Past Events Portfolio & Track Record
                </label>
                <textarea
                  rows={2}
                  required
                  value={organizerData.pastEventsTrackRecord}
                  onChange={(e) => setOrganizerData({ ...organizerData, pastEventsTrackRecord: e.target.value })}
                  placeholder="Details of previous hackathons organized, attendee counts, prize partners, and links..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Proposed Avyantrix Challenge / Sprint Concept
                </label>
                <textarea
                  rows={2}
                  required
                  value={organizerData.proposedChallengeVision}
                  onChange={(e) => setOrganizerData({ ...organizerData, proposedChallengeVision: e.target.value })}
                  placeholder="Proposed theme, target engineering disciplines, anticipated timelines, and sponsor backing..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Community / Event Portal URL (Luma, Discord, Website)
                  </label>
                  <input
                    type="url"
                    required
                    value={organizerData.communityUrl}
                    onChange={(e) => setOrganizerData({ ...organizerData, communityUrl: e.target.value })}
                    placeholder="https://luma.com/event or https://community.org"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Institutional Letter / Proof Document Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={organizerData.proofDocumentUrl}
                    onChange={(e) => setOrganizerData({ ...organizerData, proofDocumentUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              Evidence is securely archived for Avyantrix Super-Admin verification.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-zinc-950 py-2.5 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting Track Application...
                </>
              ) : (
                "Submit Track Application"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Historical Verification Requests */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
          Submission History & Status ({requests.length})
        </h2>

        {requests.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {requests.map((req) => (
              <div key={req.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {req.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        req.status === "VERIFIED"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : req.status === "REJECTED"
                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}
                    >
                      {req.status === "VERIFIED" && <CheckCircle2 className="h-3 w-3" />}
                      {req.status === "PENDING" && <Clock className="h-3 w-3" />}
                      {req.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                      {req.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">{formatDateTime(req.createdAt)}</span>
                </div>

                {req.notes && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    {req.notes}
                  </p>
                )}

                {req.evidence && req.evidence.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {req.evidence.map((ev: any) => (
                      <span
                        key={ev.id}
                        className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                      >
                        <FileCode className="h-3 w-3 text-red-500" />
                        {ev.title}
                      </span>
                    ))}
                  </div>
                )}

                {req.reviewNotes && (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                    <strong>Reviewer Feedback:</strong> {req.reviewNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic">No past verification requests.</p>
        )}
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
