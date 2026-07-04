"use client";

import { useState } from "react";

const KEY = "atlas:graph-help-dismissed";

const TIPS = [
  "Drag nodes to rearrange the graph.",
  "Scroll to zoom.",
  "Click a node to explore its connections.",
  "Double-click a node to open its full Atlas page.",
  "Use the search box to quickly find people, companies, events or tags.",
  "Toggle the coloured filters to hide or show different node types.",
  'Use "Fit to screen" if you get lost.',
  "Larger nodes represent more connected or important entities.",
  "Separate islands represent different professional communities.",
  "Bridge nodes connect multiple communities and often represent valuable networking links.",
];

/**
 * Collapsible "How to use the Network Graph" panel shown above the graph.
 * Expanded on first visit; "Don't show again" persists dismissal in
 * localStorage. Lives inside NetworkGraph, which is client-only (its section
 * is dynamically imported with ssr:false), so reading localStorage in the
 * initial state is safe — no SSR/hydration mismatch.
 */
export function GraphHelpPanel() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== "1";
    } catch {
      return true;
    }
  });

  function dontShowAgain() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore storage failures
    }
    setOpen(false);
  }

  return (
    <div className="mb-3 rounded-xl border border-gray-200 dark:border-[#30363d]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
      >
        <span className="text-sm font-medium">How to use the Network Graph</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-[#30363d]">
          <ul className="space-y-1.5 text-sm text-gray-600 dark:text-[#8b949e]">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="text-gray-400">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <button
              type="button"
              onClick={dontShowAgain}
              className="text-xs text-gray-500 hover:underline"
            >
              Don&apos;t show again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
