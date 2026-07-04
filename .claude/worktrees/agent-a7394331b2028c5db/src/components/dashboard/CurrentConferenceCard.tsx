"use client";

import { useState } from "react";

import Link from "next/link";

import type { ConferenceStatus } from "@/lib/capture/queries";

const ENDED_KEY = "atlas_conference_ended";
const PREFS_KEY = "atlas_capture_prefs";

export function CurrentConferenceCard({
  conference,
}: {
  conference: ConferenceStatus;
}) {
  // Lazy initializer reads localStorage once at mount — no effect needed.
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    const today = new Date().toISOString().split("T")[0];
    return localStorage.getItem(ENDED_KEY) === today;
  });

  if (hidden) return null;

  function handleEndConference() {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(ENDED_KEY, today);
    localStorage.removeItem(PREFS_KEY);
    setHidden(true);
  }

  return (
    <section className="mb-8 rounded border border-gray-200 p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
        Current conference
      </p>
      {conference.eventName ? (
        <h2 className="text-base font-semibold">{conference.eventName}</h2>
      ) : (
        <h2 className="text-base font-semibold text-gray-500">No event selected</h2>
      )}
      <p className="mt-0.5 text-sm text-gray-500">
        Captured today: {conference.capturedCount}
      </p>
      {conference.recentCaptures.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {conference.recentCaptures.map((p) => (
            <li key={p.id} className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="text-xs text-green-500">✓</span>
              <Link href={`/people/${p.id}`} className="hover:underline">
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={
          conference.eventId
            ? `/events/${conference.eventId}/capture`
            : "/capture"
        }
        className="mt-4 block rounded border border-gray-800 bg-gray-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700"
      >
        Continue →
      </Link>
      <button
        type="button"
        onClick={handleEndConference}
        className="mt-2 w-full text-center text-xs text-gray-400 hover:underline"
      >
        End conference
      </button>
    </section>
  );
}
