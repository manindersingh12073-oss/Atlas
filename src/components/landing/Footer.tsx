import Link from "next/link";

import { FEEDBACK_URL } from "@/lib/config";
import { ATLAS_VERSION } from "@/lib/export/formatters";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8 dark:border-[#30363d]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm sm:flex-row">
        <p className="font-semibold">Atlas</p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-gray-400 dark:text-[#656d76]">
          <Link
            href="/privacy"
            className="transition-colors hover:text-gray-700 dark:hover:text-[#8b949e]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-gray-700 dark:hover:text-[#8b949e]"
          >
            Terms
          </Link>
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-gray-700 dark:hover:text-[#8b949e]"
          >
            Feedback
          </a>
          <span>Version {ATLAS_VERSION} Beta</span>
        </nav>
      </div>
    </footer>
  );
}
