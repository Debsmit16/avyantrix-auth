"use client";

import { useState } from "react";
import { Share2, Check, Copy, Linkedin, Twitter, Code2 } from "lucide-react";

export function ProfileShareButtons({
  username,
  fullName,
  headline,
}: {
  username: string;
  fullName: string;
  headline?: string | null;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${username}`
    : `https://auth.avyantrix.com/u/${username}`;

  const badgeMarkdown = `[![Avyantrix Verified](https://auth.avyantrix.com/api/v1/badges/${username})](https://auth.avyantrix.com/u/${username})`;

  const shareText = encodeURIComponent(
    `Check out my verified engineering credentials & profile on Avyantrix ID (@${username}):`
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyBadge = async () => {
    try {
      await navigator.clipboard.writeText(badgeMarkdown);
      setCopiedBadge(true);
      setTimeout(() => setCopiedBadge(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Share2 className="h-3.5 w-3.5 text-red-500" />
          Share & Embed Verified Profile
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Share to LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
        >
          <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" /> Share to LinkedIn
        </a>

        {/* Share to X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(profileUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
        >
          <Twitter className="h-3.5 w-3.5 text-[#1DA1F2]" /> Post on X
        </a>

        {/* Copy Badge Markdown */}
        <button
          type="button"
          onClick={handleCopyBadge}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
        >
          {copiedBadge ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Copied Markdown!
            </>
          ) : (
            <>
              <Code2 className="h-3.5 w-3.5 text-red-500" /> Copy GitHub Badge
            </>
          )}
        </button>

        {/* Copy Profile Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Copied Link!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-zinc-400" /> Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
