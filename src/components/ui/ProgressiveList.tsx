"use client";

import { useEffect, useMemo, useState } from "react";

// Reusable progressive-loading list wrapper, shared by every long list in Atlas
// (People, Events, completed Follow-ups). Renders only a window of the items,
// with a persisted page-size selector and a "Load more" button.
//
// The items are passed already rendered (server components pass their <li>
// array straight through), so slicing here avoids mounting thousands of cards.
//
// When `showAll` is set (an active search), paging is bypassed and every item
// is shown; clearing search restores the previously loaded amount because the
// component keeps its `loaded` state across renders.

const OPTIONS = [25, 50, 100, 250, "all"] as const;
type PageSize = (typeof OPTIONS)[number];
const DEFAULT: PageSize = 50;
const ALL_LOADED = Number.MAX_SAFE_INTEGER;

function parseStored(value: string | null): PageSize {
  if (value === "all") return "all";
  const n = Number(value);
  return (OPTIONS as readonly (number | string)[]).includes(n)
    ? (n as PageSize)
    : DEFAULT;
}

export function ProgressiveList({
  items,
  storageKey,
  label,
  listClassName,
  showAll = false,
  compact = false,
}: {
  items: React.ReactNode[];
  storageKey: string;
  label: string;
  listClassName: string;
  showAll?: boolean;
  /**
   * When true, the count + page-size controls are hidden unless the list
   * actually exceeds one page. Keeps small grouped lists (e.g. the dashboard
   * follow-up groups) uncluttered while still paging long ones.
   */
  compact?: boolean;
}) {
  const total = items.length;
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT);
  const [loaded, setLoaded] = useState<number>(50);

  // Apply the persisted preference after mount. Reading localStorage in an
  // initializer would mismatch SSR, so we reveal it post-paint via rAF (state
  // is set inside the callback, not synchronously in the effect body).
  useEffect(() => {
    let stored: PageSize = DEFAULT;
    try {
      stored = parseStored(localStorage.getItem(storageKey));
    } catch {
      stored = DEFAULT;
    }
    if (stored === DEFAULT) return;
    const id = requestAnimationFrame(() => {
      setPageSize(stored);
      setLoaded(stored === "all" ? ALL_LOADED : stored);
    });
    return () => cancelAnimationFrame(id);
  }, [storageKey]);

  function changePageSize(next: PageSize) {
    setPageSize(next);
    setLoaded(next === "all" ? ALL_LOADED : next);
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {
      // ignore storage failures
    }
  }

  function loadMore() {
    setLoaded((l) => l + (pageSize === "all" ? total : pageSize));
  }

  const visibleCount = showAll ? total : Math.min(loaded, total);
  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = !showAll && visibleCount < total;
  const pageCount = pageSize === "all" ? total : pageSize;
  const showChrome = !compact || showAll || total > pageCount;

  return (
    <div>
      {showChrome && (
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {showAll
            ? `Showing all ${total} ${label}`
            : `Showing ${visibleCount} of ${total} ${label}`}
        </p>
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-500">
          Show
          <select
            value={String(pageSize)}
            onChange={(e) =>
              changePageSize(
                e.target.value === "all"
                  ? "all"
                  : (Number(e.target.value) as PageSize),
              )
            }
            className="rounded border border-gray-300 px-1.5 py-1 text-xs dark:bg-[#161b22]"
          >
            {OPTIONS.map((o) => (
              <option key={o} value={String(o)}>
                {o === "all" ? "All" : o}
              </option>
            ))}
          </select>
        </label>
      </div>
      )}

      <ul className={listClassName}>{visible}</ul>

      {hasMore && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-[#3d444e] dark:hover:bg-[#1c2230]"
          >
            Load more ({total - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
