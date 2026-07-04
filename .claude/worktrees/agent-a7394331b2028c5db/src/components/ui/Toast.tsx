"use client";

import { useEffect } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  "person-saved":      "✓ Person saved",
  "event-saved":       "✓ Event saved",
  "follow-up-saved":   "✓ Follow-up saved",
  "deleted":           "✓ Deleted",
  "restored":          "✓ Data restored",
  "feedback-thanks":   "Thank you for helping improve Atlas.",
};

/**
 * Reads the `?toast=X` URL param as the single source of truth — no state needed.
 * The message is visible while the param exists; an effect cleans up the URL
 * after the display duration by calling router.replace (external system sync).
 * Requires a Suspense boundary at the call site (uses useSearchParams).
 */
export function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const key = searchParams.get("toast");
  const message = key ? MESSAGES[key] : null;

  useEffect(() => {
    if (!message) return;

    // Strip the param after the display duration. router.replace is external
    // system synchronisation — calling it in an effect is correct.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("toast");
    const cleanUrl = next.toString()
      ? `${pathname}?${next.toString()}`
      : pathname;

    const t = setTimeout(() => {
      router.replace(cleanUrl, { scroll: false });
    }, 3500);

    return () => clearTimeout(t);
  }, [message, pathname, router, searchParams]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-medium text-green-800 shadow-lg dark:border-green-800 dark:bg-[#0d2015] dark:text-green-300"
    >
      {message}
    </div>
  );
}
