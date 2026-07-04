"use client";

import { useState } from "react";

export type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * Reads the stored theme once via a lazy initializer — no effect needed.
 * The lazy function runs once at mount on the client; `window` is always
 * available at that point in a Client Component.
 */
export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem("atlas_theme") as Theme | null;
    return stored && OPTIONS.some((o) => o.value === stored) ? stored : "system";
  });

  function applyTheme(t: Theme) {
    setTheme(t);
    localStorage.setItem("atlas_theme", t);
    const dark =
      t === "dark" ||
      (t === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => applyTheme(opt.value)}
          className={`rounded border px-3 py-1.5 text-sm font-medium transition-colors ${
            theme === opt.value
              ? "border-gray-700 bg-gray-800 text-white"
              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
