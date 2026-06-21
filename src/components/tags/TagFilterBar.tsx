"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { TagWithCount } from "@/lib/tags/queries";

type Props = {
  allTags: TagWithCount[];
  selectedTagIds: string[];
  // Props rather than useSearchParams so no Suspense boundary is required —
  // same pattern as SearchInput.tsx.
  pathname: string;
  currentQ: string;
  currentSort: string;
};

export function TagFilterBar({
  allTags,
  selectedTagIds,
  pathname,
  currentQ,
  currentSort,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (allTags.length === 0) return null;

  const selectedSet = new Set(selectedTagIds);

  // Selected tags pinned to the front, then remaining tags ordered by count.
  const ordered = [
    ...allTags.filter((t) => selectedSet.has(t.id)),
    ...allTags.filter((t) => !selectedSet.has(t.id)),
  ];

  function toggle(tagId: string) {
    const next = selectedSet.has(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    const params = new URLSearchParams();
    if (currentQ) params.set("q", currentQ);
    if (currentSort) params.set("sort", currentSort);
    if (next.length > 0) params.set("tags", next.join(","));

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ordered.map((t) => {
        const active = selectedSet.has(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            disabled={pending}
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              active
                ? "border-gray-500 bg-gray-800 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t.name}
            {t.count > 0 && (
              <span className={active ? "text-gray-400" : "text-gray-400"}>
                ({t.count})
              </span>
            )}
            {active && <span className="ml-0.5 text-gray-400">×</span>}
          </button>
        );
      })}
    </div>
  );
}
