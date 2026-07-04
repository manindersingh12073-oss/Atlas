"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Person = { id: string; name: string; company: string | null };

type Props = {
  selected: Person[];
  onSelect: (person: Person) => void;
  onRemove: (id: string) => void;
  recentPeople?: Person[];
  excludeIds?: string[];
  placeholder?: string;
};

export function PersonPicker({
  selected,
  onSelect,
  onRemove,
  recentPeople = [],
  excludeIds = [],
  placeholder = "Search people…",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedIds = new Set([...selected.map((p) => p.id), ...excludeIds]);

  const filteredRecent = recentPeople.filter(
    (p) =>
      !selectedIds.has(p.id) &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase())),
  );

  const recentIds = new Set(recentPeople.map((p) => p.id));
  const filteredResults = results.filter(
    (p) => !selectedIds.has(p.id) && !recentIds.has(p.id),
  );

  const showDropdown = open && (filteredRecent.length > 0 || filteredResults.length > 0);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function handleQueryChange(q: string) {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.length < 1) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const supabase = createClient();
      const escapedQ = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      const { data } = await supabase
        .from("people")
        .select("id, name, company")
        .ilike("name", `%${escapedQ}%`)
        .limit(20);
      // Filter client-side to exclude already-selected and recent (shown separately).
      setResults(
        ((data ?? []) as Person[]).filter(
          (p) => !selectedIds.has(p.id) && !recentIds.has(p.id),
        ).slice(0, 8),
      );
    }, 300);
  }

  function handleSelect(person: Person) {
    onSelect(person);
    setQuery("");
    setResults([]);
    // Keep open so the user can add more people.
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
            >
              {p.name}
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                className="leading-none text-gray-400 hover:text-gray-600"
                aria-label={`Remove ${p.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
            if (e.key === "Enter") {
              e.preventDefault(); // prevent form submit
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="block w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-500 focus:outline-none"
        />

        {showDropdown && (
          <div className="absolute left-0 top-full z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
            {filteredRecent.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-xs font-medium text-gray-400">Recent</p>
                {filteredRecent.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    {p.company && (
                      <span className="text-xs text-gray-400">{p.company}</span>
                    )}
                  </button>
                ))}
              </>
            )}
            {filteredResults.length > 0 && (
              <>
                {filteredRecent.length > 0 && (
                  <p className="px-3 pt-2 pb-1 text-xs font-medium text-gray-400">People</p>
                )}
                {filteredResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    {p.company && (
                      <span className="text-xs text-gray-400">{p.company}</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
