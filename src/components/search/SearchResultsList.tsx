"use client";

import { TAG_DOT, type Item, type Section } from "./items";

/**
 * Presentational grouped result list shared by the inline search bar and the
 * command palette. Renders section headings + item rows and highlights the
 * active row; all behaviour (fetching, nav) lives in the shared hooks.
 */
export function SearchResultsList({
  sections,
  activeKey,
  onHover,
  onSelect,
  loading,
  emptyMessage,
}: {
  sections: Section[];
  activeKey: string | null;
  onHover: (key: string) => void;
  onSelect: (item: Item) => void;
  loading?: boolean;
  emptyMessage?: string | null;
}) {
  if (loading) {
    return <p className="px-4 py-3 text-sm text-gray-500">Searching…</p>;
  }

  if (sections.length === 0) {
    return emptyMessage ? (
      <p className="px-4 py-3 text-sm text-gray-500">{emptyMessage}</p>
    ) : null;
  }

  return (
    <>
      {sections.map((section) => (
        <div key={section.heading} className="py-1">
          <p className="px-4 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {section.heading}
          </p>
          <ul>
            {section.items.map((item) => {
              const isActive = item.key === activeKey;
              return (
                <li key={item.key} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onMouseMove={() => onHover(item.key)}
                    onClick={() => onSelect(item)}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left ${
                      isActive
                        ? "bg-gray-100 dark:bg-[#1c2230]"
                        : "hover:bg-gray-50 dark:hover:bg-[#1c2230]"
                    }`}
                  >
                    {item.kind === "tag" && (
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          TAG_DOT[item.color ?? "blue"] ?? TAG_DOT.blue
                        }`}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="shrink-0 truncate text-xs text-gray-400">
                        {item.sublabel}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
