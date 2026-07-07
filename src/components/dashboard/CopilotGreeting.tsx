"use client";

import { useEffect, useState } from "react";

/**
 * Time-of-day greeting computed client-side (so it reflects the visitor's
 * local time, not server time). Defaults to a neutral "Hello" for the first
 * render to avoid an SSR/hydration mismatch, then corrects on mount — same
 * idiom as the app's other localStorage/client-time-driven UI.
 */
export function CopilotGreeting({ firstName }: { firstName: string | null }) {
  const [greeting, setGreeting] = useState("Hello");

  // Deferred via rAF (state set inside the callback, not synchronously in
  // the effect body) — same idiom as ProgressiveList's post-mount reveal.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const hour = new Date().getHours();
      setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="mb-3">
      <p className="text-base font-medium text-gray-900 dark:text-[#e6edf3]">
        {greeting}
        {firstName ? `, ${firstName}` : ""}.
      </p>
      <p className="text-sm text-gray-500 dark:text-[#8b949e]">Here&apos;s what&apos;s happening in your network today.</p>
    </div>
  );
}
