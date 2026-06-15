import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

// Parses YYYY-MM-DD without going through UTC — avoids day-shift in negative
// offset timezones that Date("YYYY-MM-DD") would cause.
function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, location")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link
          href="/events/new"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Add event
        </Link>
      </div>

      {events && events.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded border border-gray-200">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">{event.name}</p>
                  {(event.event_date || event.location) && (
                    <p className="text-xs text-gray-500">
                      {[
                        event.event_date ? formatEventDate(event.event_date) : null,
                        event.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-sm text-gray-400">→</span>
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
