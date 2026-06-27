"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/lib/auth/actions";
import { FeedbackButton } from "@/components/ui/FeedbackButton";

// ── Nav link with active-state highlighting ────────────────────────────────

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  // Mark active for exact match and all sub-paths (e.g. /people/[id]).
  const isActive =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
        isActive
          ? "bg-gray-100 text-gray-900 dark:bg-[#1c2230] dark:text-[#e6edf3]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-[#8b949e] dark:hover:bg-[#1c2230] dark:hover:text-[#cdd5de]"
      }`}
    >
      {children}
    </Link>
  );
}

const NAV_LINKS = [
  { href: "/people", label: "People" },
  { href: "/events", label: "Events" },
  { href: "/capture", label: "Capture" },
];

// ── TopNav ─────────────────────────────────────────────────────────────────

export function TopNav({ userEmail }: { userEmail: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-[#30363d] dark:bg-[#161b22]">
      <div className="mx-auto flex h-12 max-w-[62rem] items-center gap-4 px-6">
        {/* ── Logo ──────────────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          className="shrink-0 text-sm font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 rounded dark:text-[#e6edf3]"
        >
          Atlas
        </Link>

        {/* ── Desktop nav ───────────────────────────────────────────── */}
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* ── Spacer ────────────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Desktop right side ────────────────────────────────────── */}
        <div className="hidden items-center gap-2 sm:flex">
          {/* Shortcuts hint */}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("atlas:shortcuts"))
            }
            title="Keyboard shortcuts (?)"
            className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 dark:border-[#30363d] dark:text-[#656d76] dark:hover:text-[#8b949e]"
          >
            ?
          </button>

          <FeedbackButton variant="nav" />

          <NavLink href="/settings">Settings</NavLink>

          <span className="text-xs text-gray-300 dark:text-[#3d444e]">
            {userEmail}
          </span>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded px-2 py-1 text-sm text-gray-400 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 dark:text-[#656d76] dark:hover:text-[#8b949e]"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* ── Mobile hamburger ──────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 sm:hidden dark:text-[#8b949e] dark:hover:bg-[#1c2230]"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 sm:hidden dark:border-[#30363d] dark:bg-[#161b22]">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} onClick={closeMobile}>
                {link.label}
              </NavLink>
            ))}
            <NavLink href="/settings" onClick={closeMobile}>
              Settings
            </NavLink>
          </nav>
          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-[#30363d]">
            <div className="mb-3">
              <FeedbackButton variant="nav" onAfterClick={closeMobile} />
            </div>
            <p className="mb-2 text-xs text-gray-400 dark:text-[#656d76]">
              {userEmail}
            </p>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:underline dark:text-[#8b949e]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
