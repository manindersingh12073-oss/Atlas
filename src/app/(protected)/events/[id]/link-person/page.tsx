import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoBlockedPage } from "@/components/demo/DemoBlockedPage";
import { LinkPersonForm } from "@/components/event-people/LinkPersonForm";
import { isDemoMode } from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function LinkPersonPage({ params }: Props) {
  const { id } = await params;

  if (await isDemoMode()) return <DemoBlockedPage backHref={`/events/${id}`} backLabel="Event" />;

  const supabase = await createClient();

  const [eventResult, allPeopleResult, linkedResult] = await Promise.all([
    supabase.from("events").select("id, name").eq("id", id).single(),
    supabase.from("people").select("id, name, company, role").order("name"),
    supabase.from("event_people").select("person_id").eq("event_id", id),
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

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Link existing person</h1>
        <Link
          href={`/events/${event.id}/add-person`}
          className="shrink-0 text-sm text-gray-500 hover:underline"
        >
          Create new person →
        </Link>
      </div>

      {allPeople.length === 0 ? (
        <p className="text-sm text-gray-500">
          You have no people yet.{" "}
          <Link href={`/events/${event.id}/add-person`} className="underline">
            Create a new person.
          </Link>
        </p>
      ) : availablePeople.length === 0 ? (
        <p className="text-sm text-gray-500">
          All your people are already linked to this event.{" "}
          <Link href={`/events/${event.id}/add-person`} className="underline">
            Create a new person instead.
          </Link>
        </p>
      ) : (
        <LinkPersonForm availablePeople={availablePeople} eventId={event.id} />
      )}
    </main>
  );
}
