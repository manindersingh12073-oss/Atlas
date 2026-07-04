import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { RemovePersonButton } from "@/components/event-people/RemovePersonButton";
import { deleteEvent } from "@/lib/events/actions";
import { removePersonFromEvent } from "@/lib/event-people/actions";
import { createClient } from "@/lib/supabase/server";

function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Shape returned by the nested select on event_people.
type PersonLink = {
  encounter_note: string | null;
  person_id: string;
  people: {
    id: string;
    name: string;
    company: string | null;
    role: string | null;
  } | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [eventResult, linkedResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_date, location, description, created_at, updated_at")
      .eq("id", id)
      .single(),
    supabase
      .from("event_people")
      .select("encounter_note, person_id, people(id, name, company, role)")
      .eq("event_id", id),
  ]);

  if (!eventResult.data) notFound();

  const event = eventResult.data;
  const linkedPeople = (linkedResult.data ?? []) as PersonLink[];
  const peopleCount = linkedPeople.length;

  const deleteEventWithId = deleteEvent.bind(null, event.id);

  return (
    <main className="mx-auto max-w-[62rem] p-6">
      <div className="mb-4">
        <Link href="/events" className="text-sm text-gray-500 hover:underline">
          ← Events
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{event.name}</h1>
          {event.event_date && (
            <p className="mt-0.5 text-sm font-medium text-gray-700">
              {formatEventDate(event.event_date)}
            </p>
          )}
          {event.location && (
            <p className="text-sm text-gray-500">{event.location}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/events/${event.id}/capture`}
            className="rounded border border-gray-800 bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            Capture people →
          </Link>
          <Link
            href={`/events/${event.id}/edit`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteEventButton deleteAction={deleteEventWithId} />
        </div>
      </div>

      <dl className="divide-y divide-gray-100 rounded border border-gray-200">
        {event.description && (
          <div className="px-4 py-3">
            <dt className="text-xs font-medium text-gray-500">Description</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm">{event.description}</dd>
          </div>
        )}
        <div className="px-4 py-3">
          <dt className="text-xs font-medium text-gray-500">Added</dt>
          <dd className="mt-0.5 text-sm text-gray-600">{formatTimestamp(event.created_at)}</dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-xs font-medium text-gray-500">Last updated</dt>
          <dd className="mt-0.5 text-sm text-gray-600">{formatTimestamp(event.updated_at)}</dd>
        </div>
      </dl>

      {/* ── People section ─────────────────────────────────────────── */}
      <section className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">
            People met here{" "}
            <span className="text-sm font-normal text-gray-500">
              ({peopleCount})
            </span>
          </h2>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/events/${event.id}/link-person`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Link existing person
            </Link>
            <Link
              href={`/events/${event.id}/add-person`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Create new person
            </Link>
          </div>
        </div>

        {linkedPeople.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No people linked yet.{" "}
            <Link href={`/events/${event.id}/link-person`} className="underline">
              Link existing person
            </Link>
            {" or "}
            <Link href={`/events/${event.id}/add-person`} className="underline">
              create new person.
            </Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200">
            {linkedPeople.map((link) => {
              if (!link.people) return null;
              const person = link.people;
              const removeAction = removePersonFromEvent.bind(
                null,
                event.id,
                person.id,
              );
              return (
                <li key={person.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/people/${person.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {person.name}
                      </Link>
                      {(person.role || person.company) && (
                        <p className="text-xs text-gray-500">
                          {[person.role, person.company]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      {link.encounter_note && (
                        <p className="mt-1 text-xs italic text-gray-500">
                          {link.encounter_note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Link
                        href={`/events/${event.id}/people/${person.id}/edit-note`}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        {link.encounter_note ? "Edit note" : "Add note"}
                      </Link>
                      <RemovePersonButton removeAction={removeAction} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
