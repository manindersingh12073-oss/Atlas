"use client";

import { useEffect } from "react";

/**
 * Listens for OS-level dark/light changes and re-applies the theme when
 * the user's preference is set to "system". The initial class is already
 * applied by the inline ThemeScript before hydration, so this component
 * only needs to handle dynamic changes after mount.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function applyTheme() {
      const stored = localStorage.getItem("atlas_theme") ?? "system";
      const dark =
        stored === "dark" ||
        (stored === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", applyTheme);
    return () => mq.removeEventListener("change", applyTheme);
  }, []);

  return <>{children}</>;
}
