import Link from "next/link";
import { Suspense } from "react";

import { PeopleSearchInput } from "@/components/people/PeopleSearchInput";
import { SortSelect } from "@/components/SortSelect";
import {
  DEFAULT_PEOPLE_SORT,
  PEOPLE_SORT_OPTIONS,
  getPersonEventData,
  parsePeopleSort,
  searchPeople,
} from "@/lib/people/queries";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

export default async function PeoplePage({ searchParams }: Props) {
  const { q, sort: sortParam } = await searchParams;
  const query = q?.trim() ?? "";
  const sort = parsePeopleSort(sortParam);
  const hasQuery = query.length > 0;

  const supabase = await createClient();

  const [people, eventDataMap] = await Promise.all([
    searchPeople(supabase, query, sort),
    getPersonEventData(supabase),
  ]);

  // "Most events" sort is applied in JS after joining event counts.
  // When a search query is active, results are always name-sorted (sort ignored).
  const displayPeople =
    !hasQuery && sort === "events_desc"
      ? [...people].sort((a, b) => {
          const ca = eventDataMap.get(a.id)?.event_count ?? 0;
          const cb = eventDataMap.get(b.id)?.event_count ?? 0;
          return cb - ca;
        })
      : people;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">People</h1>
        <Link
          href="/people/new"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Add person
        </Link>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-2">
          {/* Form wrapper keeps Enter-key submission working as a GET fallback. */}
          <form method="GET" action="/people" className="flex-1">
            <PeopleSearchInput defaultValue={query} currentSort={sort} />
          </form>
          <Suspense
            fallback={
              <select disabled className="cursor-not-allowed rounded border border-gray-300 px-2 py-1.5 text-sm opacity-50">
                <option>
                  {PEOPLE_SORT_OPTIONS.find((o) => o.value === sort)?.label}
                </option>
              </select>
            }
          >
            <SortSelect
              options={PEOPLE_SORT_OPTIONS}
              value={hasQuery ? DEFAULT_PEOPLE_SORT : sort}
              disabled={hasQuery}
            />
          </Suspense>
        </div>
        {hasQuery && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {displayPeople.length}{" "}
              {displayPeople.length === 1 ? "result" : "results"} for{" "}
              <span className="font-medium">&ldquo;{query}&rdquo;</span>
            </p>
            <Link href="/people" className="text-xs text-gray-500 hover:underline">
              Clear search
            </Link>
          </div>
        )}
      </div>

      {displayPeople.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded border border-gray-200">
          {displayPeople.map((person) => {
            const ed = eventDataMap.get(person.id);
            return (
              <li key={person.id}>
                <Link
                  href={`/people/${person.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{person.name}</p>
                    {(person.company || person.role) && (
                      <p className="text-xs text-gray-500">
                        {[person.role, person.company]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {ed && ed.event_count > 0 && (
                      <p className="text-xs text-gray-400">
                        {ed.event_count}{" "}
                        {ed.event_count === 1 ? "event" : "events"}
                        {ed.recent_events.length > 0 &&
                          " · " +
                            ed.recent_events.map((e) => e.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="ml-4 shrink-0 text-sm text-gray-400">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : hasQuery ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            No people found matching{" "}
            <span className="font-medium">&ldquo;{query}&rdquo;</span>.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/people/new?name=${encodeURIComponent(query)}`}
              className="rounded border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Add &ldquo;{query}&rdquo;
            </Link>
            <Link href="/people" className="text-sm text-gray-500 hover:underline">
              Clear search
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No people yet.{" "}
          <Link href="/people/new" className="underline">
            Add your first person.
          </Link>
        </p>
      )}
    </main>
  );
}
