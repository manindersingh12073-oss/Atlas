"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

/**
 * Controlled search input that updates the URL as the user types.
 *
 * On each keystroke, a 300ms debounce fires router.replace("/people?q=…"),
 * which triggers a server-side re-render of the people list with fresh results.
 * router.replace (not push) keeps the browser history clean — back button
 * skips over intermediate queries rather than replaying each one.
 *
 * The form wrapper in the parent page handles Enter-key submission as a
 * native GET request, which produces the same URL and behaves identically.
 */
export function PeopleSearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const url = value.trim()
        ? `/people?q=${encodeURIComponent(value.trim())}`
        : "/people";
      startTransition(() => router.replace(url));
    }, 300);
  }

  // Clear any pending timer if the component unmounts.
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
