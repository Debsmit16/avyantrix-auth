import Link from "next/link";
import { Shield, KeyRound, CheckCircle2, Lock, ArrowRight, Layers, Cpu, Globe, Code2, GraduationCap, Building2, Trophy } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Subtle Radial Glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-red-500/15 via-rose-500/10 to-zinc-500/5 opacity-50 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Main Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-3.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 mb-6 shadow-2xs">
            <Shield className="h-3.5 w-3.5" />
            <span>Avyantrix Identity Platform (V1)</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
            One Identity. <br />
            <span className="bg-gradient-to-r from-red-600 via-zinc-800 to-zinc-950 dark:from-red-500 dark:via-zinc-200 dark:to-white bg-clip-text text-transparent">
              Unified Deep-Tech Access.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Avyantrix Auth provides unified single sign-on, Argon2id cryptographic security, and capability-verified identity for builders, mentors, and enterprise partners across the Avyantrix ecosystem.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all"
            >
              Create Avyantrix ID <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* 4 Role Personas Grid */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Role Hierarchies & Clearances
            </h2>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
              Purpose-built Workspaces for Every Participant
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Persona 1 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900/50 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 mb-3">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Builder Workspace</h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Connect GitHub repositories, submit verified proofs of work, and unlock builds across platforms.
              </p>
            </div>

            {/* Persona 2 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900/50 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 mb-3">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Mentor Hub</h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Conduct technical prototype evaluations, guide builders through bottlenecks, and host advisory hours.
              </p>
            </div>

            {/* Persona 3 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900/50 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 mb-3">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Problem Owner</h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Publish real-world enterprise engineering briefs, hardware constraints, and sponsored bounty tracks.
              </p>
            </div>

            {/* Persona 4 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900/50 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 mb-3">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Challenge Organizer</h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Host competitive sprints, manage judging rubrics, and coordinate team submissions with live leaderboards.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white mb-4">
                <Layers className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Unified Identity</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Single sign-on across Avyantrix Builds, Challenges, and upcoming deep-tech ecosystems with a single synchronized profile.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white mb-4">
                <CheckCircle2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Verified Capabilities</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Prove technical capability through peer-reviewed code artifacts, research publications, and verified challenge track records.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white mb-4">
                <Lock className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Argon2id & Auth Security</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Memory-hard password hashing, individual session revocation, multi-device signout, and strict rate-limiting.
              </p>
            </div>
          </div>
        </div>

        {/* Product Gateway Ecosystem */}
        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-8 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Integrated Avyantrix Platforms</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              One account connects you seamlessly to all ecosystem platforms
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://builds.avyantrix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold text-sm">
                B
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-red-500 transition-colors">
                  Avyantrix Builds
                </h4>
                <p className="text-xs text-zinc-500">Collaborative engineering & venture development</p>
              </div>
            </a>

            <a
              href="https://challenges.avyantrix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-bold text-sm">
                C
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-red-500 transition-colors">
                  Avyantrix Challenges
                </h4>
                <p className="text-xs text-zinc-500">Competitive hackathons & deep-tech problem solving</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
