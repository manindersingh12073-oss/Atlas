"use client";

import { ACTION_CATEGORIES, COPILOT_ACTIONS } from "@/lib/assistant/registry";

/**
 * The default (empty-query) view of AskAtlasPalette — a grouped list of
 * built-in prompt templates. This is what makes the palette read as a
 * command surface rather than a blank chat box: free-form input is always
 * available below, but templates are what the user sees first.
 */
export function PromptTemplateMenu({ onSelect }: { onSelect: (templateId: string) => void }) {
  // "summarise-relationship" / "summarise-history" are used directly by
  // person-page/timeline quick actions, not shown in the general menu.
  const visible = COPILOT_ACTIONS.filter(
    (t) => t.id !== "summarise-relationship" && t.id !== "summarise-history" && t.id !== "summarise-attendees",
  );

  return (
    <div className="py-1">
      {ACTION_CATEGORIES.map((cat) => {
        const items = visible.filter((t) => t.category === cat.value);
        if (items.length === 0) return null;
        return (
          <div key={cat.value} className="px-1 py-1">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#656d76]">
              {cat.label}
            </p>
            <ul>
              {items.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(t.id)}
                    className="flex w-full flex-col items-start rounded px-3 py-2 text-left hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500 dark:hover:bg-[#1c2230]"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-[#e6edf3]">{t.label}</span>
                    <span className="text-xs text-gray-500 dark:text-[#8b949e]">{t.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
