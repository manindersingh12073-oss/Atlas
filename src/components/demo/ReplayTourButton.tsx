"use client";

import { REOPEN_TOUR_EVENT } from "@/components/demo/DemoWelcomeTour";

export function ReplayTourButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(REOPEN_TOUR_EVENT))}
      className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
    >
      Replay welcome tour
    </button>
  );
}
