import Link from "next/link";

import { DemoBlockedNotice } from "@/components/demo/DemoBlockedNotice";

/**
 * Rendered instead of a real create/edit/link/capture page when a Demo Mode
 * visitor navigates there directly (link click, command palette, keyboard
 * shortcut, or a typed URL — all land here, since only the data source
 * differs from production, not the route tree).
 */
export function DemoBlockedPage({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center p-6">
      <div className="w-full rounded-xl border border-gray-200 dark:border-[#30363d]">
        <DemoBlockedNotice />
      </div>
      <Link href={backHref} className="mt-4 text-sm text-gray-500 hover:underline">
        ← {backLabel}
      </Link>
    </main>
  );
}
