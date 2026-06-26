"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MESSAGES: Record<string, { text: string; type: "success" | "info" }> = {
  "person-saved":    { text: "✓ Person saved",            type: "success" },
  "event-saved":     { text: "✓ Event saved",             type: "success" },
  "follow-up-saved": { text: "✓ Follow-up saved",         type: "success" },
  "deleted":         { text: "✓ Deleted",                 type: "success" },
  "restored":        { text: "✓ Data restored",           type: "success" },
};

/**
 * Reads a `?toast=X` URL param on mount, shows a brief notification, then
 * removes the param from the URL. Requires a Suspense boundary at the call site.
 */
export function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [entry, setEntry] = useState<{ text: string; type: "success" | "info" } | null>(null);

  useEffect(() => {
    const key = searchParams.get("toast");
    const msg = key ? MESSAGES[key] : undefined;
    if (!msg) return;

    setEntry(msg);

    // Strip the param from the URL without re-triggering a navigation.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("toast");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    const t = setTimeout(() => setEntry(null), 3500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (!entry) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-medium text-green-800 shadow-lg duration-200 dark:border-green-800 dark:bg-[#0d2015] dark:text-green-300"
    >
      {entry.text}
    </div>
  );
}
