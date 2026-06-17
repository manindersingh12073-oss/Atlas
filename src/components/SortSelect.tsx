"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Option = { readonly value: string; readonly label: string };

/**
 * Sort selector that updates only the ?sort= param while preserving all other
 * query params (e.g. ?q= on the people page).
 *
 * Uses useSearchParams() internally so that no function props need to be passed
 * from Server Components (Next.js App Router does not allow non-server-action
 * functions to cross the Server → Client boundary as props).
 *
 * Must be wrapped in <Suspense> at each render site.
 */
export function SortSelect({
  options,
  value,
  disabled,
}: {
  options: readonly Option[];
  value: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const isDisabled = disabled || isPending;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isDisabled}
      className={`rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-500 focus:outline-none${isDisabled ? " cursor-not-allowed opacity-50" : ""}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
