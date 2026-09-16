"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function VerificationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Verification Form State
  const [category, setCategory] = useState("CAPABILITY_BUILDER");
  const [notes, setNotes] = useState("");
  const [evidenceList, setEvidenceList] = useState<
    Array<{ evidenceType: string; title: string; evidenceUrl: string; description: string }>
  >([
    {
      evidenceType: "GITHUB_REPO",
      title: "Core Project Repository",
      evidenceUrl: "",
      description: "",
    },
  ]);

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

  const addEvidenceRow = () => {
    setEvidenceList([
      ...evidenceList,
      {
        evidenceType: "GITHUB_REPO",
        title: "",
        evidenceUrl: "",
        description: "",
      },
    ]);
  };

  const removeEvidenceRow = (index: number) => {
    if (evidenceList.length <= 1) return;
    setEvidenceList(evidenceList.filter((_, i) => i !== index));
  };

  const updateEvidence = (index: number, field: string, value: string) => {
    const updated = [...evidenceList];
    updated[index] = { ...updated[index], [field]: value };
    setEvidenceList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/verification/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          notes,
          evidence: evidenceList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit verification request.");
      } else {
        setSuccess("Verification request submitted successfully. It will be reviewed by the team.");
        setNotes("");
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Builder & Capability Verification</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Prove your engineering capability, research publications, or problem-owner credentials
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
          Active Verified Badges
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Badges earned through verified engineering proof, displayed on your public Avyantrix ID
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
          <p className="text-xs text-zinc-400 italic">No verification badges earned yet.</p>
        )}
      </div>

      {/* Submit Verification Request Form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-1">
          Submit Capability Evidence
        </h2>
        <p className="text-xs text-zinc-500 mb-6">
          Evidence links are strictly private and only visible to Avyantrix technical reviewers
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Verification Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="CAPABILITY_BUILDER">Capability Verified Builder (Code & Prototypes)</option>
              <option value="EDUCATION">Education & Institutional Verification</option>
              <option value="PROBLEM_OWNER">Problem Owner / Enterprise Sponsor</option>
              <option value="IDENTITY">Government / Identity Verification</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Submission Overview / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide a brief summary of what you've engineered or your role in the submitted work..."
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* Evidence Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Proof Links & Repositories ({evidenceList.length})
              </label>
              <button
                type="button"
                onClick={addEvidenceRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another Proof
              </button>
            </div>

            {evidenceList.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Proof #{idx + 1}
                  </span>
                  {evidenceList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEvidenceRow(idx)}
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
                      onChange={(e) => updateEvidence(idx, "evidenceType", e.target.value)}
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
                      onChange={(e) => updateEvidence(idx, "title", e.target.value)}
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
                      onChange={(e) => updateEvidence(idx, "evidenceUrl", e.target.value)}
                      placeholder="https://github.com/organization/repository"
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white py-1.5 px-2.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-zinc-950 py-2.5 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit for Verification"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Historical Verification Requests */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
          Submission History ({requests.length})
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

                {req.notes && <p className="text-xs text-zinc-600 dark:text-zinc-400">{req.notes}</p>}

                {req.reviewNotes && (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                    <strong>Reviewer Notes:</strong> {req.reviewNotes}
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
