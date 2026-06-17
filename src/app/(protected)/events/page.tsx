import Link from "next/link";
import { Suspense } from "react";

import { SortSelect } from "@/components/SortSelect";
import {
  EVENT_SORT_OPTIONS,
  getEvents,
  parseEventSort,
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
  searchParams: Promise<{ sort?: string }>;
};

export default async function EventsPage({ searchParams }: Props) {
  const { sort: sortParam } = await searchParams;
  const sort = parseEventSort(sortParam);

  const supabase = await createClient();
  const events = await getEvents(supabase, sort);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link
          href="/events/new"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Add event
        </Link>
      </div>

      <div className="mb-6">
        <Suspense
          fallback={
            <select disabled className="cursor-not-allowed rounded border border-gray-300 px-2 py-1.5 text-sm opacity-50">
              <option>
                {EVENT_SORT_OPTIONS.find((o) => o.value === sort)?.label}
              </option>
            </select>
          }
        >
          <SortSelect options={EVENT_SORT_OPTIONS} value={sort} />
        </Suspense>
      </div>

      {events.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded border border-gray-200">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
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
      ) : (
        <p className="text-sm text-gray-500">
          No events yet.{" "}
          <Link href="/events/new" className="underline">
            Add your first event.
          </Link>
        </p>
      )}
    </main>
  );
}
