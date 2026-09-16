import Link from "next/link";
import { Shield, KeyRound, CheckCircle2, Lock, ArrowRight, Layers, Cpu, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-red-500/20 to-zinc-800/10 opacity-60 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 mb-6">
            <Shield className="h-3.5 w-3.5" />
            Central Avyantrix Identity Platform (V1)
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
            One Identity. <br />
            <span className="bg-gradient-to-r from-red-600 via-zinc-800 to-zinc-950 dark:from-red-500 dark:via-zinc-200 dark:to-white bg-clip-text text-transparent">
              Access All Avyantrix Platforms.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Avyantrix Auth provides unified, cryptographic authentication and capability-verified identity for builders, researchers, and partners across Avyantrix Builds, Challenges, and future platforms.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all"
            >
              Create Avyantrix ID <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white mb-4">
                <Layers className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Unified Identity</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Single sign-on across Avyantrix Builds, Challenges, and upcoming deep-tech ecosystems with a unified profile.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white mb-4">
                <CheckCircle2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Verified Builder Badges</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Prove technical capability through peer-reviewed code artifacts, research papers, and verified challenge track records.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white mb-4">
                <Lock className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Argon2id & Authoritative Sessions</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Memory-hard password hashing, individual session revocation, multi-device signout, and strict rate-limiting.
              </p>
            </div>
          </div>
        </div>

        {/* Product Gateway Ecosystem */}
        <div className="mx-auto mt-20 max-w-4xl rounded-2xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Integrated Avyantrix Ecosystem</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              One account connects you to all platforms
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold">
                B
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Avyantrix Builds</h4>
                <p className="text-xs text-zinc-500">Collaborative engineering & venture development</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-bold">
                C
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Avyantrix Challenges</h4>
                <p className="text-xs text-zinc-500">Competitive hackathons & deep-tech problem solving</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
