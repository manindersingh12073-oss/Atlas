"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isTyping(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

// ── Shortcuts dialog ──────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs font-mono text-gray-600 dark:border-[#30363d] dark:bg-[#1c2230] dark:text-[#9da7b3]">
      {children}
    </kbd>
  );
}

function ShortcutRow({
  keys,
  label,
}: {
  keys: React.ReactNode[];
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600 dark:text-[#8b949e]">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <Kbd key={i}>{k}</Kbd>
        ))}
      </div>
    </div>
  );
}

function ShortcutGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#656d76]">
        {title}
      </p>
      <div className="divide-y divide-gray-100 dark:divide-[#30363d]">
        {children}
      </div>
    </div>
  );
}

function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-[#30363d] dark:bg-[#161b22]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-[#656d76] dark:hover:text-[#8b949e]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <ShortcutGroup title="Navigate">
            <ShortcutRow keys={["G", "P"]} label="People" />
            <ShortcutRow keys={["G", "E"]} label="Events" />
            <ShortcutRow keys={["G", "C"]} label="Capture" />
            <ShortcutRow keys={["G", "D"]} label="Dashboard" />
            <ShortcutRow keys={["G", "S"]} label="Settings" />
          </ShortcutGroup>

          <ShortcutGroup title="Pages">
            <ShortcutRow keys={["N"]} label="New person (People)" />
            <ShortcutRow keys={["N"]} label="New event (Events)" />
            <ShortcutRow keys={["/"]} label="Focus search" />
            <ShortcutRow keys={["?"]} label="This dialog" />
          </ShortcutGroup>

          <ShortcutGroup title="Capture mode">
            <ShortcutRow keys={["↵"]} label="Save & Next" />
            <ShortcutRow keys={["⌘", "↵"]} label="Save & View" />
          </ShortcutGroup>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  // Keep ref in sync to avoid stale closure in the event listener.
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Listen for external "open shortcuts" events (from the ? button in TopNav).
  useEffect(() => {
    function handleCustomEvent() {
      setOpen(true);
    }
    window.addEventListener("atlas:shortcuts", handleCustomEvent);
    return () => window.removeEventListener("atlas:shortcuts", handleCustomEvent);
  }, []);

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    function handleKeyDown(e: KeyboardEvent) {
      // Escape always closes the dialog, regardless of focus.
      if (e.key === "Escape" && openRef.current) {
        setOpen(false);
        return;
      }

      // All other shortcuts are suppressed when the user is typing.
      if (isTyping(e)) {
        gPressed = false;
        clearTimeout(gTimer);
        return;
      }

      // ── G-then-X navigation (GitHub style, 1 s window) ──────────
      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey) {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => {
          gPressed = false;
        }, 1000);
        return;
      }

      if (gPressed && !e.ctrlKey && !e.metaKey) {
        gPressed = false;
        clearTimeout(gTimer);
        switch (e.key.toLowerCase()) {
          case "p":
            router.push("/people");
            return;
          case "e":
            router.push("/events");
            return;
          case "c":
            router.push("/capture");
            return;
          case "d":
            router.push("/dashboard");
            return;
          case "s":
            router.push("/settings");
            return;
        }
      }

      // ── Page-level: N → New ──────────────────────────────────────
      if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey) {
        if (pathname === "/people") {
          router.push("/people/new");
          return;
        }
        if (pathname === "/events") {
          router.push("/events/new");
          return;
        }
      }

      // ── / → Focus search ─────────────────────────────────────────
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          "[data-shortcut-search]",
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // ── ? → Shortcuts dialog ─────────────────────────────────────
      if (e.key === "?") {
        setOpen(true);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimer);
    };
  }, [pathname, router]);

  if (!open) return null;
  return <ShortcutsDialog onClose={() => setOpen(false)} />;
}
