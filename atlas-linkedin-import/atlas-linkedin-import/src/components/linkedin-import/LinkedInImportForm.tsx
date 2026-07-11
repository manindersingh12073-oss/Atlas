"use client";

import { useMemo, useState, useTransition } from "react";
import { parseLinkedInCsv } from "@/lib/linkedin-import/parseCsv";
import { importLinkedInConnections } from "@/lib/linkedin-import/actions";
import type { ImportCandidate } from "@/lib/linkedin-import/types";
import type { PersonLite } from "@/lib/linkedin-import/queries";

type Props = {
  existingPeople: PersonLite[];
};

function checkDuplicate(
  name: string,
  linkedinUrl: string,
  existingPeople: PersonLite[]
): boolean {
  const normalizedName = name.trim().toLowerCase();
  return existingPeople.some((p) => {
    if (linkedinUrl && p.linkedin_url && p.linkedin_url === linkedinUrl) {
      return true;
    }
    return p.name.trim().toLowerCase() === normalizedName;
  });
}

export function LinkedInImportForm({ existingPeople }: Props) {
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [parseInfo, setParseInfo] = useState<{
    skippedRows: number;
    headerFound: boolean;
  } | null>(null);
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportActionResult | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseLinkedInCsv(text);

      const withMeta: ImportCandidate[] = parsed.candidates.map((c, i) => {
        const dup = checkDuplicate(c.name, c.linkedinUrl, existingPeople);
        return {
          ...c,
          id: `${i}-${c.name}`,
          isDuplicate: dup,
          selected: !dup, // likely duplicates start unchecked, still overridable
        };
      });

      setCandidates(withMeta);
      setParseInfo({
        skippedRows: parsed.skippedRows,
        headerFound: parsed.headerFound,
      });
      setResult(null);
    };
    reader.readAsText(file);
  }

  const filtered = useMemo(() => {
    if (!filter.trim()) return candidates;
    const q = filter.trim().toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    );
  }, [candidates, filter]);

  const selectedCount = candidates.filter((c) => c.selected).length;

  function toggle(id: string) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  }

  function toggleAllVisible(checked: boolean) {
    const visibleIds = new Set(filtered.map((c) => c.id));
    setCandidates((prev) =>
      prev.map((c) => (visibleIds.has(c.id) ? { ...c, selected: checked } : c))
    );
  }

  function handleImport() {
    const selected = candidates.filter((c) => c.selected);
    startTransition(async () => {
      const res = await importLinkedInConnections(
        selected.map(({ id: _id, isDuplicate: _dup, selected: _sel, ...rest }) => rest)
      );
      setResult(res);
      if (!res.error) {
        const importedIds = new Set(selected.map((c) => c.id));
        setCandidates((prev) => prev.filter((c) => !importedIds.has(c.id)));
      }
    });
  }

  return (
    <div className="space-y-6">
      {candidates.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="mb-4 text-sm text-gray-600">
            Export your connections from LinkedIn (Settings → Data privacy →
            Get a copy of your data → Connections), then upload the CSV here.
            Nothing is added to Atlas until you select people and confirm
            below.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {parseInfo && !parseInfo.headerFound && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Couldn't find the expected LinkedIn header row in this file — it may
          not be a standard Connections export. Results below may be
          incomplete.
        </p>
      )}

      {candidates.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Filter by name or company…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full max-w-xs rounded border border-gray-300 px-3 py-1.5 text-sm"
            />
            <div className="flex shrink-0 items-center gap-3 text-sm">
              <button
                type="button"
                onClick={() => toggleAllVisible(true)}
                className="text-blue-600 hover:underline"
              >
                Select all visible
              </button>
              <button
                type="button"
                onClick={() => toggleAllVisible(false)}
                className="text-gray-500 hover:underline"
              >
                Deselect all
              </button>
            </div>
          </div>

          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={c.selected}
                  onChange={() => toggle(c.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[c.role, c.company].filter(Boolean).join(" at ") || "—"}
                  </p>
                </div>
                {c.isDuplicate && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Possible duplicate
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedCount} of {candidates.length} selected
              {parseInfo && parseInfo.skippedRows > 0 && (
                <> · {parseInfo.skippedRows} rows skipped (no name)</>
              )}
            </p>
            <button
              type="button"
              disabled={selectedCount === 0 || isPending}
              onClick={handleImport}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Importing…" : `Add ${selectedCount} to Atlas`}
            </button>
          </div>
        </>
      )}

      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
      {result && !result.error && (
        <p className="text-sm text-green-700">
          Added {result.importedCount} people, tagged "LinkedIn Import".
        </p>
      )}
    </div>
  );
}

type ImportActionResult = {
  error: string | null;
  importedCount?: number;
};
