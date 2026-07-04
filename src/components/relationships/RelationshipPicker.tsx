"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { addRelationship } from "@/lib/relationships/actions";
import { RELATIONSHIP_OPTIONS } from "@/lib/relationships/queries";
import type { RelationshipType } from "@/lib/relationships/queries";
import { useDemoGuard } from "@/lib/demo/context";

type Person = { id: string; name: string; company: string | null };

type Props = {
  personId: string;
  recentPeople: Person[];
  redirectTo: string;
};

export function RelationshipPicker({ personId, recentPeople, redirectTo }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<RelationshipType>("met_together");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const guard = useDemoGuard();

  const filteredRecent = recentPeople.filter(
    (p) =>
      p.id !== personId &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase())),
  );

  const recentIds = new Set(recentPeople.map((p) => p.id));
  const filteredResults = results.filter(
    (p) => p.id !== personId && !recentIds.has(p.id),
  );

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setResults([]);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function handleSearch(q: string) {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      const supabase = createClient();
      const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      const { data } = await supabase
        .from("people")
        .select("id, name, company")
        .ilike("name", `%${escaped}%`)
        .limit(20);
      setResults(
        ((data ?? []) as Person[]).filter(
          (p) => p.id !== personId && !recentIds.has(p.id),
        ).slice(0, 8),
      );
    }, 300);
  }

  function handleSelect(targetId: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    startTransition(() => addRelationship(personId, targetId, type, redirectTo));
  }

  // Opens capture mode with relationship context so that after the new person
  // is created the relationship is automatically formed and the user is returned
  // to this page — no manual steps required.
  function handleCreateNew() {
    const params = new URLSearchParams({
      relationshipTarget: personId,
      relationshipType: type,
      returnTo: redirectTo,
    });
    router.push(`/capture?${params.toString()}`);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => guard(() => setOpen(true))}
        className="text-sm text-gray-500 hover:underline"
      >
        + Add relationship
      </button>
    );
  }

  const hasResults = filteredRecent.length > 0 || filteredResults.length > 0;

  return (
    <div ref={containerRef} className="rounded border border-gray-200 p-3 space-y-2">
      {/* Relationship type */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value as RelationshipType)}
        className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      >
        {RELATIONSHIP_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Person search */}
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
            setResults([]);
          }
        }}
        placeholder="Search people…"
        autoFocus
        className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />

      {/* Search results — recent first, then ilike results */}
      {hasResults && (
        <ul className="max-h-48 overflow-y-auto rounded border border-gray-100">
          {filteredRecent.length > 0 && (
            <li className="px-3 py-1 text-xs font-medium text-gray-400">Recent</li>
          )}
          {filteredRecent.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => handleSelect(p.id)}
                disabled={pending}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="font-medium">{p.name}</span>
                {p.company && (
                  <span className="text-xs text-gray-400">{p.company}</span>
                )}
              </button>
            </li>
          ))}
          {filteredResults.length > 0 && (
            <li className="px-3 py-1 text-xs font-medium text-gray-400">
              {filteredRecent.length > 0 ? "People" : ""}
            </li>
          )}
          {filteredResults.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => handleSelect(p.id)}
                disabled={pending}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="font-medium">{p.name}</span>
                {p.company && (
                  <span className="text-xs text-gray-400">{p.company}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Create new person — opens capture mode with relationship context */}
      <div className={hasResults ? "border-t border-gray-100 pt-2" : ""}>
        <button
          type="button"
          onClick={handleCreateNew}
          className="flex w-full items-center gap-1 px-1 py-1.5 text-left text-sm text-blue-600 hover:underline"
        >
          Can&apos;t find them? + Create new person
        </button>
      </div>

      <button
        type="button"
        onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
        className="text-xs text-gray-400 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
