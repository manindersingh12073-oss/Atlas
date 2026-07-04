"use client";

import { useEffect, useRef, useState } from "react";

import type { TagWithCount } from "@/lib/tags/queries";

// Full Tailwind class strings — required so the scanner includes them at build time.
const STYLES: Record<string, { chip: string; text: string }> = {
  blue:   { chip: "bg-blue-100 border-blue-200",     text: "text-blue-700" },
  green:  { chip: "bg-green-100 border-green-200",   text: "text-green-700" },
  purple: { chip: "bg-purple-100 border-purple-200", text: "text-purple-700" },
  orange: { chip: "bg-orange-100 border-orange-200", text: "text-orange-700" },
  pink:   { chip: "bg-pink-100 border-pink-200",     text: "text-pink-700" },
  teal:   { chip: "bg-teal-100 border-teal-200",     text: "text-teal-700" },
  indigo: { chip: "bg-indigo-100 border-indigo-200", text: "text-indigo-700" },
  rose:   { chip: "bg-rose-100 border-rose-200",     text: "text-rose-700" },
};

function getStyle(color: string) {
  return STYLES[color] ?? STYLES.blue;
}

type Props = {
  allTags: TagWithCount[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function CaptureTagSelector({ allTags, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = new Set(selectedIds);
  const selectedTags = allTags.filter((t) => selectedSet.has(t.id));

  const q = query.toLowerCase();
  const available = allTags.filter(
    (t) => !selectedSet.has(t.id) && (!q || t.name.toLowerCase().includes(q)),
  );

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function addTag(tagId: string) {
    onChange([...selectedIds, tagId]);
    setQuery("");
    // Stay open so user can add more tags without re-tapping.
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function removeTag(tagId: string) {
    onChange(selectedIds.filter((id) => id !== tagId));
  }

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => {
          const style = getStyle(tag.color);
          return (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-0.5 rounded border px-2 py-0.5 text-xs font-medium ${style.chip} ${style.text}`}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="ml-0.5 leading-none opacity-50 hover:opacity-100"
                aria-label={`Remove ${tag.name}`}
              >
                ×
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="inline-flex items-center rounded border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600"
        >
          + Add tag
        </button>
      </div>

      {open && (
        <div className="mt-1 rounded border border-gray-200 bg-white shadow-md">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
              }
              if (e.key === "Enter") {
                e.preventDefault(); // prevent form submit
                if (available.length === 1) addTag(available[0].id);
              }
            }}
            placeholder="Search tags…"
            className="w-full border-b border-gray-100 px-3 py-2 text-xs outline-none"
          />
          <ul className="max-h-40 overflow-y-auto py-1">
            {available.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => addTag(t.id)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-gray-50"
                >
                  <span>{t.name}</span>
                  {t.count > 0 && <span className="text-gray-400">({t.count})</span>}
                </button>
              </li>
            ))}
            {available.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-400">
                {allTags.length === 0 ? "No tags yet" : "No matching tags"}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
