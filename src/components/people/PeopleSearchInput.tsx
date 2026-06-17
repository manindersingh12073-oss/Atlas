"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { DEFAULT_PEOPLE_SORT } from "@/lib/people/queries";

/**
 * Debounced search input for the people page.
 * Accepts currentSort as a prop so it can preserve the sort param in URL
 * updates without needing useSearchParams (which requires a Suspense boundary).
 */
export function PeopleSearchInput({
  defaultValue,
  currentSort,
}: {
  defaultValue: string;
  currentSort: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildUrl(q: string): string {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (currentSort && currentSort !== DEFAULT_PEOPLE_SORT)
      params.set("sort", currentSort);
    const qs = params.toString();
    return `/people${qs ? `?${qs}` : ""}`;
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
      placeholder="Search by name, company, role or notes…"
      autoComplete="off"
      className={`block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none${isPending ? " opacity-60" : ""}`}
    />
  );
}
