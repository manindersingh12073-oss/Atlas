import Link from "next/link";

import { AskAtlasButton } from "@/components/assistant/AskAtlasButton";
import type { ReconnectionSuggestions } from "@/lib/assistant/context/insights";

/**
 * Proactive recommendations on the dashboard Copilot card — backed by
 * getReconnectionSuggestions()/getReconnectionSuggestionsDemo(), a plain,
 * non-LLM function, so this renders instantly with no OpenAI call.
 */
export function TodaysSuggestions({ suggestions }: { suggestions: ReconnectionSuggestions }) {
  const rows = suggestions.stale.slice(0, 3);
  if (rows.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-[#8b949e]">Today&apos;s Suggestions</p>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.personId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-teal-100 bg-white/60 px-3 py-2 text-sm dark:border-teal-900/40 dark:bg-transparent"
          >
            <span className="min-w-0">
              Reconnect with{" "}
              <Link href={`/people/${r.personId}`} className="font-medium hover:underline">
                {r.personName}
              </Link>
              <span className="text-gray-500 dark:text-[#8b949e]">
                {" — "}
                {r.daysSinceContact > 0 ? `${r.daysSinceContact} days since contact` : "no recent contact"}
              </span>
            </span>
            <AskAtlasButton
              templateId="draft-email"
              personName={r.personName}
              label="Draft follow-up"
              variant="chip"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
