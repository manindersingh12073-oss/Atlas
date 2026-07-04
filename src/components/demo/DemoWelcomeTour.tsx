"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

const DISMISSED_KEY = "atlas:demo-tour-dismissed";
const PROGRESS_KEY = "atlas:demo-tour-progress";

// Dispatched by ReplayTourButton (Settings) to bring the tour back.
export const REOPEN_TOUR_EVENT = "atlas:demo-tour-reopen";

type Step = { label: string; href?: string };

const STEPS: Step[] = [
  { label: 'Search for "Sarah"', href: "/people?q=Sarah" },
  { label: "Open her profile" },
  { label: "Explore her relationships" },
  { label: "View the Network Graph", href: "/insights" },
  { label: "Open Insights", href: "/insights" },
  { label: "Check Follow-ups", href: "/dashboard#follow-ups" },
  { label: "Open Command Palette (Ctrl/Cmd + K)" },
  { label: "Export the demo backup", href: "/settings" },
];

function readSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

// Lazy initializers read localStorage directly (client-only component, only
// ever mounted in Demo Mode — same pattern as CurrentConferenceCard).
function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function readInitialProgress(): Set<number> {
  if (typeof window === "undefined") return new Set();
  return readSet(PROGRESS_KEY);
}

export function DemoWelcomeTour() {
  const [visible, setVisible] = useState(() => !readDismissed());
  const [done, setDone] = useState<Set<number>>(readInitialProgress);

  useEffect(() => {
    function onReopen() {
      setDone(readSet(PROGRESS_KEY));
      setVisible(true);
      try {
        localStorage.removeItem(DISMISSED_KEY);
      } catch {
        // ignore storage failures
      }
    }
    window.addEventListener(REOPEN_TOUR_EVENT, onReopen);
    return () => window.removeEventListener(REOPEN_TOUR_EVENT, onReopen);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore storage failures
    }
  }

  function markDone(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(i);
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }

  if (!visible) return null;

  const completedCount = done.size;
  const allDone = completedCount === STEPS.length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-[#30363d] dark:bg-[#161b22]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Welcome to Atlas</p>
          <p className="text-xs text-gray-500">
            {allDone ? "You've explored the essentials." : `${completedCount}/${STEPS.length} done — try these:`}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss tour"
          className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-[#cdd5de]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ul className="space-y-1.5">
        {STEPS.map((step, i) => {
          const checked = done.has(i);
          const row = (
            <span className="flex items-center gap-2 text-left">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                  checked
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 text-transparent dark:border-[#3d444e]"
                }`}
                aria-hidden
              >
                ✓
              </span>
              <span className={`text-xs ${checked ? "text-gray-400 line-through" : "text-gray-700 dark:text-[#cdd5de]"}`}>
                {step.label}
              </span>
            </span>
          );

          if (step.href) {
            return (
              <li key={step.label}>
                <Link href={step.href} onClick={() => markDone(i)} className="block rounded px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-[#1c2230]">
                  {row}
                </Link>
              </li>
            );
          }

          return (
            <li key={step.label}>
              <button type="button" onClick={() => markDone(i)} className="block w-full rounded px-1 py-0.5 text-left hover:bg-gray-50 dark:hover:bg-[#1c2230]">
                {row}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
