import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkEventForm } from "@/components/event-people/LinkEventForm";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function LinkEventPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [personResult, allEventsResult, linkedResult] = await Promise.all([
    supabase.from("people").select("id, name").eq("id", id).single(),
    supabase
      .from("events")
      .select("id, name, event_date, location")
      .order("event_date", { ascending: false, nullsFirst: false }),
    supabase.from("event_people").select("event_id").eq("person_id", id),
  ]);

  if (!personResult.data) notFound();

  const person = personResult.data;
  const allEvents = allEventsResult.data ?? [];
  const linkedIds = new Set((linkedResult.data ?? []).map((r) => r.event_id));
  const availableEvents = allEvents.filter((e) => !linkedIds.has(e.id));

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link
          href={`/people/${person.id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          ← {person.name}
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">Link existing event</h1>

      {allEvents.length === 0 ? (
        <p className="text-sm text-gray-500">
          You have no events yet.{" "}
          <Link
            href={`/people/${person.id}/add-event`}
            className="underline"
          >
            Create a new event instead.
          </Link>
        </p>
      ) : availableEvents.length === 0 ? (
        <p className="text-sm text-gray-500">
          All your events are already linked to this person.
        </p>
      ) : (
        <LinkEventForm availableEvents={availableEvents} personId={person.id} />
      )}
    </main>
  );
}
