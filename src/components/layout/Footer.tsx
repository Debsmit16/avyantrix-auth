import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="h-5 w-5 rounded overflow-hidden bg-black p-0.5 border border-zinc-200 dark:border-zinc-800">
            <img src="/brand/avyantrix-logo.png" alt="Avyantrix" className="h-full w-full object-contain" />
          </div>
          <span>
            Avyantrix Identity System &bull; Unified Authentication &bull; &copy; {new Date().getFullYear()} Avyantrix
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
          <a
            href="https://www.avyantrix.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Avyantrix Home
          </a>
          <a
            href="https://www.avyantrix.com/ventures/wrev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            WRev Platform
          </a>
          <Link href="/security" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Security Overview
          </Link>
        </div>
      </div>
    </footer>
  );
}
