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
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, loading, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Avyantrix ID", icon: Shield, authRequired: true },
    { href: "/profile", label: "Profile", icon: User, authRequired: true },
    { href: "/security", label: "Security & Sessions", icon: KeyRound, authRequired: true },
    { href: "/verification", label: "Verification", icon: CheckCircle2, authRequired: true },
  ];

  if (hasRole("ADMIN")) {
    navLinks.push({ href: "/admin", label: "Admin Console", icon: Lock, authRequired: true });
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-base transition-transform group-hover:scale-105">
              A
            </div>
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              AVYANTRIX <span className="text-red-500 font-semibold text-xs tracking-widest uppercase ml-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">AUTH</span>
            </span>
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
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Main Website Link */}
          <a
            href="https://www.avyantrix.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            avyantrix.com <ExternalLink className="h-3 w-3" />
          </a>

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/u/${user.username}`}
                    className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-2 pr-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.firstName}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-white">
                        {user.firstName[0]}
                      </div>
                    )}
                    <span>@{user.username}</span>
                  </Link>

                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                !isAuthPage && (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-md bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
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
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
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
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
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
