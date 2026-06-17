"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

/**
 * Generic debounced search input that updates ?q= in the URL while preserving
 * the current sort param. Used by both the people and events pages.
 *
 * Accepts pathname and defaultSort as props so it doesn't need useSearchParams
 * (which would require a Suspense boundary). The caller passes the current sort
 * value; this component only updates ?q= and carries sort through unchanged.
 */
export function SearchInput({
  defaultValue,
  currentSort,
  defaultSort,
  pathname,
  placeholder = "Search…",
}: {
  defaultValue: string;
  currentSort: string;
  defaultSort: string;
  pathname: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildUrl(q: string): string {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (currentSort && currentSort !== defaultSort)
      params.set("sort", currentSort);
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      startTransition(() => router.replace(buildUrl(value)));
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      name="q"
      type="search"
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder={placeholder}
      autoComplete="off"
      className={`block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none${isPending ? " opacity-60" : ""}`}
    />
  );
}
