"use client";

import { SearchInput } from "@/components/SearchInput";
import { DEFAULT_PEOPLE_SORT } from "@/lib/people/queries";

/**
 * Thin wrapper around SearchInput for the people page.
 * Binds pathname="/people" and the people default sort.
 */
export function PeopleSearchInput({
  defaultValue,
  currentSort,
}: {
  defaultValue: string;
  currentSort: string;
}) {
  return (
    <SearchInput
      defaultValue={defaultValue}
      currentSort={currentSort}
      defaultSort={DEFAULT_PEOPLE_SORT}
      pathname="/people"
      placeholder="Search by name, company, role or notes…"
    />
  );
}
