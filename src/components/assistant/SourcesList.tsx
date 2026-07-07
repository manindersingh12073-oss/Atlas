import type { AtlasFact, AtlasSource } from "@/lib/assistant/context/answerSchema";

const SOURCE_KIND_ICON: Record<string, string> = {
  event: "📍",
  note: "📝",
  relationship: "🤝",
  tag: "🏷️",
  follow_up: "🔔",
  person: "👤",
};

/**
 * Shared Facts + top-level Sources rendering — extracted from AnswerCard so
 * MeetingBriefCard's "Sources" section reuses the exact same citation
 * treatment instead of duplicating it.
 */
export function SourcesList({ facts, sources }: { facts?: AtlasFact[]; sources?: AtlasSource[] }) {
  if ((!facts || facts.length === 0) && (!sources || sources.length === 0)) return null;

  return (
    <div className="space-y-3">
      {facts && facts.length > 0 && (
        <ul className="space-y-1.5">
          {facts.map((fact, i) => (
            <li key={i} className="text-sm text-gray-700 dark:text-[#cdd5de]">
              <span>{fact.text}</span>
              <span className="ml-1.5 flex flex-wrap gap-1 pt-0.5">
                {fact.sources.map((s, j) => (
                  <span
                    key={j}
                    className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500 dark:border-[#30363d] dark:bg-[#1c2230] dark:text-[#8b949e]"
                  >
                    {SOURCE_KIND_ICON[s.kind] ?? "•"} {s.label}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {sources && sources.length > 0 && (
        <p className="border-t border-gray-100 pt-2 text-xs text-gray-400 dark:border-[#30363d] dark:text-[#656d76]">
          Sources: {sources.map((s) => s.label).join(" · ")}
        </p>
      )}
    </div>
  );
}
