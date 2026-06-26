"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { addTagToPerson, createAndAddTag } from "@/lib/tags/actions";
import type { TagWithCount } from "@/lib/tags/queries";

type Props = {
  personId: string;
  allTags: TagWithCount[];
  personTagIds: string[];
  triggerLabel?: string;
};

export function TagPicker({
  personId,
  allTags,
  personTagIds,
  triggerLabel = "+ Add tag",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const attachedSet = new Set(personTagIds);
  const q = query.trim().toLowerCase();

  const available = allTags.filter(
    (t) => !attachedSet.has(t.id) && (q === "" || t.name.toLowerCase().includes(q)),
  );

  const exactMatch = allTags.some((t) => t.name.toLowerCase() === q);
  const showCreate = q.length > 0 && !exactMatch;

  // Total navigable items: available tags + optional "Create" entry
  const totalItems = available.length + (showCreate ? 1 : 0);

  function openPicker() {
    setOpen(true);
    setQuery("");
    setFocusedIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(tagId: string) {
    setOpen(false);
    setQuery("");
    setFocusedIndex(-1);
    startTransition(() => addTagToPerson(personId, tagId));
  }

  function handleCreate() {
    const name = query.trim();
    if (!name) return;
    setOpen(false);
    setQuery("");
    setFocusedIndex(-1);
    startTransition(() => createAndAddTag(personId, name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, totalItems - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, -1));
        break;

      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < available.length) {
          handleSelect(available[focusedIndex].id);
        } else if (focusedIndex === available.length && showCreate) {
          handleCreate();
        } else if (available.length === 1 && !showCreate) {
          handleSelect(available[0].id);
        } else if (showCreate && focusedIndex === -1) {
          handleCreate();
        }
        break;

      case "Escape":
        setOpen(false);
        setQuery("");
        setFocusedIndex(-1);
        break;
    }
  }

  // Reset focused index when the list changes (query changes).
  useEffect(() => {
    setFocusedIndex(-1);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={openPicker}
        disabled={pending}
        className="inline-flex items-center rounded border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
      >
        {pending ? "…" : triggerLabel}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded border border-gray-200 bg-white shadow-lg">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or create…"
            className="w-full border-b border-gray-100 px-3 py-2 text-xs outline-none"
          />
          <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
            {available.map((t, i) => (
              <li key={t.id} role="option" aria-selected={focusedIndex === i}>
                <button
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs ${
                    focusedIndex === i
                      ? "bg-gray-100 dark:bg-[#1c2230]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span>{t.name}</span>
                  {t.count > 0 && (
                    <span className="text-gray-400">({t.count})</span>
                  )}
                </button>
              </li>
            ))}

            {showCreate && (
              <li role="option" aria-selected={focusedIndex === available.length}>
                <button
                  type="button"
                  onClick={handleCreate}
                  className={`w-full px-3 py-1.5 text-left text-xs text-blue-600 ${
                    focusedIndex === available.length
                      ? "bg-blue-50 dark:bg-[#0d1f2d]"
                      : "hover:bg-blue-50"
                  }`}
                >
                  Create &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            )}

            {available.length === 0 && !showCreate && (
              <li className="px-3 py-2 text-xs text-gray-400">
                {attachedSet.size === allTags.length
                  ? "All tags attached"
                  : "No matching tags"}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
