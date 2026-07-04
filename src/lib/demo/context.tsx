"use client";

import { createContext, useCallback, useContext } from "react";

// Client-side flag mirroring the `atlas_demo` cookie, threaded down from
// (protected)/layout.tsx. Lets leaf write-components decide, with zero prop
// drilling, whether to perform their action or show the read-only notice.
const DemoModeContext = createContext(false);

export function DemoModeProvider({
  isDemo,
  children,
}: {
  isDemo: boolean;
  children: React.ReactNode;
}) {
  return <DemoModeContext.Provider value={isDemo}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}

// Dispatched by useDemoGuard(); DemoModeModal (mounted once in the protected
// layout) listens for it and shows the read-only notice as an overlay.
export const DEMO_BLOCKED_EVENT = "atlas:demo-blocked";

export function dispatchDemoBlocked() {
  window.dispatchEvent(new CustomEvent(DEMO_BLOCKED_EVENT));
}

/**
 * Wraps a same-page write action (delete, complete, add tag, etc.). In Demo
 * Mode the wrapped function is never called — the read-only notice is shown
 * instead. Everywhere else it behaves exactly like calling `fn()` directly.
 */
export function useDemoGuard() {
  const isDemo = useDemoMode();
  return useCallback(
    (fn: () => void) => {
      if (isDemo) {
        dispatchDemoBlocked();
        return;
      }
      fn();
    },
    [isDemo],
  );
}
