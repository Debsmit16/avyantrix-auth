"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  User,
  KeyRound,
  CheckCircle2,
  Lock,
  LogOut,
  ExternalLink,
  Menu,
  X,
  LayoutGrid,
  Layers,
  Trophy,
  Globe,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const { user, loading, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/dashboard", label: "Avyantrix ID", icon: Shield, authRequired: true },
    { href: "/passport", label: "Passport", icon: Zap, authRequired: true },
    { href: "/profile", label: "Profile", icon: User, authRequired: true },
    { href: "/security", label: "Security & Sessions", icon: KeyRound, authRequired: true },
    { href: "/verification", label: "Verification Hub", icon: CheckCircle2, authRequired: true },
  ];

  if (hasRole("ADMIN")) {
    navLinks.push({ href: "/admin", label: "Admin Console", icon: Lock, authRequired: true });
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // Close app switcher on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setAppSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ecosystemApps = [
    {
      name: "Avyantrix Builds",
      tagline: "Industry Problem Solving & Bounties",
      href: "https://builds.avyantrix.com",
      icon: Layers,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      badge: "Problem Solving",
      badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    },
    {
      name: "Avyantrix Challenges",
      tagline: "Hackathons, Arena & Competitions",
      href: "https://challenges.avyantrix.com",
      icon: Trophy,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      badge: "Hackathons",
      badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    },
    {
      name: "Hackathon Passport",
      tagline: "1-Click Devfolio-Alternative Dossier",
      href: "/passport",
      icon: Zap,
      color: "text-red-500 bg-red-500/10 border-red-500/20",
      badge: "Fast Pass",
      badgeColor: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/50",
      isInternal: true,
    },
    {
      name: "Avyantrix ID",
      tagline: "Central Identity & Security Engine",
      href: "/dashboard",
      icon: Shield,
      color: "text-red-500 bg-red-500/10 border-red-500/20",
      badge: "Active",
      badgeColor: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/50",
      isInternal: true,
    },
    {
      name: "Avyantrix Collective",
      tagline: "Official Homepage & Research Portal",
      href: "https://www.avyantrix.com",
      icon: Globe,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      badge: "Portal",
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#09090B]/80 transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Official Avyantrix Emblem */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black p-0.5 shadow-sm transition-transform group-hover:scale-105">
              <img
                src="/brand/avyantrix-logo.png"
                alt="Avyantrix Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                AVYANTRIX
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 dark:border-red-900/40">
                AUTH
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && !isAuthPage && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800/80 dark:text-white font-semibold shadow-xs"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-red-500" : "text-zinc-400"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Ecosystem Product Switcher (9-dots icon) */}
          <div className="relative" ref={switcherRef}>
            <button
              onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
              title="Avyantrix Ecosystem Products"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                appSwitcherOpen
                  ? "border-red-500/40 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400"
                  : "border-zinc-200/80 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            {appSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in slide-in-from-top-2 z-50">
                <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                      Avyantrix Ecosystem
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Single Sign-On</span>
                </div>

                <div className="space-y-1.5">
                  {ecosystemApps.map((app) => {
                    const Icon = app.icon;
                    const content = (
                      <div className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${app.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-red-500 transition-colors truncate">
                              {app.name}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${app.badgeColor}`}>
                              {app.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {app.tagline}
                          </p>
                        </div>
                      </div>
                    );

                    return app.isInternal ? (
                      <Link
                        key={app.name}
                        href={app.href}
                        onClick={() => setAppSwitcherOpen(false)}
                      >
                        {content}
                      </Link>
                    ) : (
                      <a
                        key={app.name}
                        href={app.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setAppSwitcherOpen(false)}
                      >
                        {content}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/u/${user.username}`}
                    className="flex items-center gap-2 rounded-full border border-zinc-200/80 bg-zinc-50/80 py-1 pl-1.5 pr-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.firstName}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-white">
                        {user.firstName[0]}
                      </div>
                    )}
                    <span>@{user.username}</span>
                  </Link>

                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/80 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                !isAuthPage && (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all"
                    >
                      Create Avyantrix ID
                    </Link>
                  </div>
                )
              )}
            </>
          )}

          {/* Mobile menu toggle */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
