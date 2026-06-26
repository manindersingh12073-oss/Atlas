"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * Persists the chosen theme in localStorage under "atlas_theme".
 * New themes can be added by extending the Theme type and OPTIONS array;
 * no other files need to change.
 */
export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("atlas_theme") as Theme | null;
    if (stored && OPTIONS.some((o) => o.value === stored)) {
      setTheme(stored);
    }
  }, []);

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
