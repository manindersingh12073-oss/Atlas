import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/ui/EmptyState";

import { SearchInput } from "@/components/SearchInput";
import { SortSelect } from "@/components/SortSelect";
import {
  DEFAULT_EVENT_SORT,
  EVENT_SORT_OPTIONS,
  parseEventSort,
  searchEvents,
} from "@/lib/events/queries";
import { createClient } from "@/lib/supabase/server";

function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

export default async function EventsPage({ searchParams }: Props) {
  const { q, sort: sortParam } = await searchParams;
  const query = q?.trim() ?? "";
  const sort = parseEventSort(sortParam);
  const hasQuery = query.length > 0;

  const supabase = await createClient();
  const events = await searchEvents(supabase, query, sort);

  return (
    <main className="mx-auto max-w-[62rem] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link
          href="/events/new"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Add event
        </Link>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-2">
          {/* Form wrapper keeps Enter-key submission working as a GET fallback. */}
          <form method="GET" action="/events" className="flex-1">
            <SearchInput
              defaultValue={query}
              currentSort={sort}
              defaultSort={DEFAULT_EVENT_SORT}
              pathname="/events"
              placeholder="Search by name, location or description…"
            />
          </form>
          <Suspense
            fallback={
              <select
                disabled
                className="cursor-not-allowed rounded border border-gray-300 px-2 py-1.5 text-sm opacity-50"
              >
                <option>
                  {EVENT_SORT_OPTIONS.find((o) => o.value === sort)?.label}
                </option>
              </select>
            }
          >
            <SortSelect
              options={EVENT_SORT_OPTIONS}
              value={hasQuery ? DEFAULT_EVENT_SORT : sort}
              disabled={hasQuery}
            />
          </Suspense>
        </div>
        {hasQuery && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {events.length}{" "}
              {events.length === 1 ? "result" : "results"} for{" "}
              <span className="font-medium">&ldquo;{query}&rdquo;</span>
            </p>
            <Link href="/events" className="text-xs text-gray-500 hover:underline">
              Clear search
            </Link>
          </div>
        )}
      </div>

      {events.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded border border-gray-200">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1c2230]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{event.name}</p>
                  {(event.event_date || event.location) && (
                    <p className="text-xs text-gray-500">
                      {[
                        event.event_date
                          ? formatEventDate(event.event_date)
                          : null,
                        event.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {event.people_count > 0 && (
                    <p className="text-xs text-gray-400">
                      {event.people_count}{" "}
                      {event.people_count === 1 ? "person" : "people"}
                    </p>
                  )}
                </div>
                <span className="ml-4 shrink-0 text-sm text-gray-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : hasQuery ? (
        <div>
          <EmptyState
            icon="🔍"
            title={`No results for "${query}"`}
            description="Try different keywords, or add a new event."
            action={{ label: "Add event", href: "/events/new" }}
          />
          <div className="mt-2 text-center">
            <Link href="/events" className="text-xs text-gray-500 hover:underline">
              Clear search
            </Link>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="📅"
          title="No events yet"
          description="Record events you attend to track who you meet and build context around each relationship."
          action={{ label: "Add your first event", href: "/events/new" }}
        />
      )}
    </main>
  );
}
