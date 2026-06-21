"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  recentCompanies: string[];
  allCompanies: string[];
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

export function CaptureCompanyInput({
  value,
  onChange,
  recentCompanies,
  allCompanies,
  onKeyDown,
  inputRef: externalRef,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = externalRef ?? internalRef;

  const q = value.toLowerCase();

  const filteredRecent = recentCompanies.filter(
    (c) => !q || c.toLowerCase().includes(q),
  );

  const recentSet = new Set(recentCompanies.map((c) => c.toLowerCase()));
  const filteredSuggestions = allCompanies
    .filter((c) => !recentSet.has(c.toLowerCase()) && (!q || c.toLowerCase().includes(q)))
    .slice(0, 8);

  const showDropdown = open && (filteredRecent.length > 0 || filteredSuggestions.length > 0);

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

  function select(company: string) {
    onChange(company);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Company"
        autoComplete="off"
        className="block w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-500 focus:outline-none"
      />

      {showDropdown && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
          {filteredRecent.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-xs font-medium text-gray-400">Recent</p>
              {filteredRecent.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => select(c)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {c}
                </button>
              ))}
            </>
          )}
          {filteredSuggestions.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-xs font-medium text-gray-400">
                {filteredRecent.length > 0 ? "Other suggestions" : "Suggestions"}
              </p>
              {filteredSuggestions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => select(c)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {c}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
