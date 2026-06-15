import Link from "next/link";
import { notFound } from "next/navigation";

import { DeletePersonButton } from "@/components/people/DeletePersonButton";
import { deletePerson } from "@/lib/people/actions";
import { createClient } from "@/lib/supabase/server";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Parses YYYY-MM-DD as a local date to avoid UTC day-shift in negative-offset timezones.
function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Shape returned by the nested select on event_people.
type EventLink = {
  encounter_note: string | null;
  events: {
    id: string;
    name: string;
    event_date: string | null;
    location: string | null;
  } | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [personResult, eventLinksResult] = await Promise.all([
    supabase
      .from("people")
      .select(
        "id, name, company, role, linkedin_url, email, phone, notes, created_at, updated_at",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("event_people")
      .select("encounter_note, events(id, name, event_date, location)")
      .eq("person_id", id),
  ]);

  if (!personResult.data) notFound();

  const person = personResult.data;
  const deletePersonWithId = deletePerson.bind(null, person.id);

  // Sort events by event_date descending, nulls last.
  // YYYY-MM-DD strings compare correctly with localeCompare.
  const eventLinks = ((eventLinksResult.data ?? []) as EventLink[]).sort(
    (a, b) => {
      const dateA = a.events?.event_date ?? null;
      const dateB = b.events?.event_date ?? null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.localeCompare(dateA);
    },
  );

  const contactFields = [
    { label: "Email", value: person.email },
    { label: "Phone", value: person.phone },
    { label: "LinkedIn", value: person.linkedin_url },
  ].filter((f) => f.value);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/people" className="text-sm text-gray-500 hover:underline">
          ← People
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{person.name}</h1>
          {(person.role || person.company) && (
            <p className="mt-0.5 text-sm text-gray-500">
              {[person.role, person.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/people/${person.id}/edit`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeletePersonButton deleteAction={deletePersonWithId} />
        </div>
      </div>

      <dl className="divide-y divide-gray-100 rounded border border-gray-200">
        {contactFields.map(({ label, value }) => (
          <div key={label} className="px-4 py-3">
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="mt-0.5 text-sm break-all">{value}</dd>
          </div>
        ))}

        {person.notes && (
          <div className="px-4 py-3">
            <dt className="text-xs font-medium text-gray-500">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm">{person.notes}</dd>
          </div>
        )}

        <div className="px-4 py-3">
          <dt className="text-xs font-medium text-gray-500">Added</dt>
          <dd className="mt-0.5 text-sm text-gray-600">
            {formatTimestamp(person.created_at)}
          </dd>
        </div>

        <div className="px-4 py-3">
          <dt className="text-xs font-medium text-gray-500">Last updated</dt>
          <dd className="mt-0.5 text-sm text-gray-600">
            {formatTimestamp(person.updated_at)}
          </dd>
        </div>
      </dl>

      {/* ── Events section ─────────────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="text-base font-semibold">
          Events{" "}
          <span className="text-sm font-normal text-gray-500">
            ({eventLinks.length})
          </span>
        </h2>

        {eventLinks.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Not linked to any events yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200">
            {eventLinks.map((link) => {
              if (!link.events) return null;
              const event = link.events;
              return (
                <li key={event.id} className="px-4 py-3">
                  <Link
                    href={`/events/${event.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {event.name}
                  </Link>
                  {event.event_date && (
                    <p className="text-xs text-gray-500">
                      {formatEventDate(event.event_date)}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  )}
                  {link.encounter_note && (
                    <p className="mt-1 text-xs italic text-gray-500">
                      {link.encounter_note}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
