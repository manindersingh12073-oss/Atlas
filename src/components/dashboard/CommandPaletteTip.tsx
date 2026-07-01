"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "atlas:cmdk-tip-dismissed";

/**
 * First-visit hint that surfaces the Cmd/Ctrl+K command palette. Shown once in
 * the top-right of the dashboard; permanently dismissed via localStorage.
 * "Try it" opens the palette by dispatching the `atlas:command-palette` event
 * (CommandPalette listens for it).
 */
export function CommandPaletteTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;
    // Reveal after paint so the entrance animation plays (and to avoid any
    // SSR/hydration mismatch — the server renders nothing).
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore storage failures — worst case the tip shows again next visit
    }
    setVisible(false);
  }

  function tryIt() {
    window.dispatchEvent(new CustomEvent("atlas:command-palette"));
    dismiss();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Command palette tip"
      className="atlas-tip-in fixed right-4 top-16 z-40 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-[#30363d] dark:bg-[#161b22]"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-sm">⌘</span>
        <p className="text-sm font-semibold">Quick tip</p>
      </div>
      <p className="text-xs leading-relaxed text-gray-500">
        Press{" "}
        <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px] text-gray-600 dark:border-[#30363d] dark:bg-[#1c2230] dark:text-[#9da7b3]">
          Ctrl
        </kbd>{" "}
        +{" "}
        <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px] text-gray-600 dark:border-[#30363d] dark:bg-[#1c2230] dark:text-[#9da7b3]">
          K
        </kbd>{" "}
        (or{" "}
        <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px] text-gray-600 dark:border-[#30363d] dark:bg-[#1c2230] dark:text-[#9da7b3]">
          ⌘
        </kbd>{" "}
        + K on Mac) to instantly search people, events, companies and actions.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={tryIt}
          className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 dark:border-[#3d444e] dark:hover:bg-[#1c2230]"
        >
          Try it
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-[#cdd5de]"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
