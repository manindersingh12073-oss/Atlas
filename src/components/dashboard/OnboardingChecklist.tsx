"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

const DISMISSED_KEY = "atlas-onboarding-dismissed";

type Item = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

export function OnboardingChecklist({
  peopleCount,
  eventsCount,
  followUpsEver,
  relationshipsCount,
}: {
  peopleCount: number;
  eventsCount: number;
  followUpsEver: number;
  relationshipsCount: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if not dismissed and user hasn't built up substantial data.
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    if (!dismissed && peopleCount < 20) {
      setVisible(true);
    }
  }, [peopleCount]);

  const items: Item[] = [
    {
      id: "person",
      label: "Add your first person",
      done: peopleCount > 0,
      href: "/people/new",
      cta: "Add person",
    },
    {
      id: "event",
      label: "Record your first event",
      done: eventsCount > 0,
      href: "/events/new",
      cta: "Add event",
    },
    {
      id: "followup",
      label: "Set a follow-up reminder",
      done: followUpsEver > 0,
      href: "/people",
      cta: "Open People",
    },
    {
      id: "capture",
      label: "Try Conference Mode",
      done: peopleCount >= 3,
      href: "/capture",
      cta: "Open Capture",
    },
    {
      id: "relationship",
      label: "Record how two people are connected",
      done: relationshipsCount > 0,
      href: "/people",
      cta: "Open People",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible || allDone) return null;

  return (
    <section className="mb-8 rounded border border-blue-200 bg-blue-50 p-4 dark:border-[#1a3a52] dark:bg-[#0d1f2d]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            Getting started
          </h2>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {doneCount} of {items.length} steps completed
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-xs text-blue-400 hover:text-blue-600 dark:text-blue-600 dark:hover:text-blue-400"
        >
          Dismiss
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                item.done
                  ? "bg-green-500 text-white"
                  : "border border-blue-300 dark:border-blue-700"
              }`}
              aria-hidden
            >
              {item.done ? "✓" : ""}
            </span>
            <span
              className={`flex-1 text-sm ${
                item.done
                  ? "text-blue-400 line-through dark:text-blue-700"
                  : "text-blue-900 dark:text-blue-200"
              }`}
            >
              {item.label}
            </span>
            {!item.done && (
              <Link
                href={item.href}
                className="shrink-0 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                {item.cta} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
