"use client";

import { useEffect, useState } from "react";

import { DEMO_BLOCKED_EVENT } from "@/lib/demo/context";
import { DemoBlockedNotice } from "@/components/demo/DemoBlockedNotice";

/**
 * Global overlay for same-page write attempts (delete, complete, add tag,
 * restore, etc.) in Demo Mode. Mounted once in the protected layout;
 * useDemoGuard() dispatches the open event from any leaf component.
 */
export function DemoModeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onBlocked() {
      setOpen(true);
    }
    window.addEventListener(DEMO_BLOCKED_EVENT, onBlocked);
    return () => window.removeEventListener(DEMO_BLOCKED_EVENT, onBlocked);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={() => setOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Demo Mode"
        className="atlas-dropdown w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-[#30363d] dark:bg-[#161b22]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <DemoBlockedNotice compact />
      </div>
    </div>
  );
}
