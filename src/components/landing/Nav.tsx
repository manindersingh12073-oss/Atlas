import Link from "next/link";

import { FEEDBACK_URL } from "@/lib/config";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-[#30363d] dark:bg-[#0f1117]/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Atlas
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-gray-500 md:flex dark:text-[#8b949e]">
          <a
            href="#product"
            className="transition-colors hover:text-gray-900 dark:hover:text-[#e6edf3]"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-gray-900 dark:hover:text-[#e6edf3]"
          >
            How it works
          </a>
          <a
            href="#use-cases"
            className="transition-colors hover:text-gray-900 dark:hover:text-[#e6edf3]"
          >
            Use cases
          </a>
          <span className="cursor-default text-gray-300 dark:text-[#30363d]">
            Pricing
            <span className="ml-1 text-xs text-gray-400 dark:text-[#656d76]">
              (Coming soon)
            </span>
          </span>
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-gray-900 dark:hover:text-[#e6edf3]"
          >
            Feedback
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-[#30363d] dark:hover:bg-[#1e2330]"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
