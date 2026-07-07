"use client";

import { useEffect, useState } from "react";

import { readRecentActions, type RecentAction } from "@/lib/assistant/recent-actions";
import { AskAtlasButton } from "./AskAtlasButton";

/**
 * Reads recently-used Atlas Copilot actions from localStorage. Renders
 * nothing when empty — the Quick Actions chips above it already cover
 * first-run discovery, so there's no need for an empty-state message here.
 */
export function RecentAIActions() {
  const [actions, setActions] = useState<RecentAction[]>([]);

  // Reading localStorage in an initializer would mismatch SSR, so it's
  // revealed post-paint via rAF (state is set inside the callback, not
  // synchronously in the effect body) — same idiom as ProgressiveList.
  useEffect(() => {
    const id = requestAnimationFrame(() => setActions(readRecentActions()));
    return () => cancelAnimationFrame(id);
  }, []);

  if (actions.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-[#8b949e]">Recently used</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <AskAtlasButton
            key={`${a.actionId}-${a.personName ?? ""}`}
            templateId={a.actionId}
            personName={a.personName}
            label={a.personName ? `${a.label} — ${a.personName}` : a.label}
            variant="chip"
          />
        ))}
      </div>
    </div>
  );
}
