"use client";

import { AISparkleIcon } from "@/components/ui/ai/AISparkleIcon";
import { ASK_ATLAS_EVENT } from "./events";

/** Mobile floating action button — the phone equivalent of Ctrl/Cmd+J. */
export function AskAtlasFab() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(ASK_ATLAS_EVENT))}
      aria-label="Open Atlas Copilot"
      title="Open Atlas Copilot"
      className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:hidden dark:bg-teal-500 dark:text-[#04120f] dark:hover:bg-teal-400"
    >
      <AISparkleIcon className="h-5 w-5" />
    </button>
  );
}
