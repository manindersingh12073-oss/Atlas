import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkPersonForm } from "@/components/event-people/LinkPersonForm";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function LinkPersonPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [eventResult, allPeopleResult, linkedResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, name")
      .eq("id", id)
      .single(),
    supabase
      .from("people")
      .select("id, name, company, role")
      .order("name"),
    supabase
      .from("event_people")
      .select("person_id")
      .eq("event_id", id),
  ]);

  if (!eventResult.data) notFound();

  const event = eventResult.data;
  const allPeople = allPeopleResult.data ?? [];
  const linkedIds = new Set((linkedResult.data ?? []).map((r) => r.person_id));
  const availablePeople = allPeople.filter((p) => !linkedIds.has(p.id));

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link
          href={`/events/${event.id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          ← {event.name}
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">Link person to event</h1>

      {allPeople.length === 0 ? (
        <p className="text-sm text-gray-500">
          You have no people yet.{" "}
          <Link href="/people/new" className="underline">
            Add a person first.
          </Link>
        </p>
      ) : availablePeople.length === 0 ? (
        <p className="text-sm text-gray-500">
          All your people are already linked to this event.
        </p>
      ) : (
        <LinkPersonForm availablePeople={availablePeople} eventId={event.id} />
      )}
    </main>
  );
}
