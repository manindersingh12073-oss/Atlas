import Link from "next/link";
import { notFound } from "next/navigation";

import { EditNoteForm } from "@/components/event-people/EditNoteForm";
import { updateEncounterNote } from "@/lib/event-people/actions";
import type { ActionState } from "@/lib/event-people/actions";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string; personId: string }> };

export default async function EditNotePage({ params }: Props) {
  const { id: eventId, personId } = await params;
  const supabase = await createClient();

  const [eventResult, personResult, linkResult] = await Promise.all([
    supabase.from("events").select("id, name").eq("id", eventId).single(),
    supabase.from("people").select("id, name").eq("id", personId).single(),
    supabase
      .from("event_people")
      .select("encounter_note")
      .eq("event_id", eventId)
      .eq("person_id", personId)
      .single(),
  ]);

  if (!eventResult.data || !personResult.data || !linkResult.data) notFound();

  const event = eventResult.data;
  const person = personResult.data;
  const link = linkResult.data;

  const updateWithIds = updateEncounterNote.bind(null, eventId, personId) as (
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;

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
      <h1 className="mb-1 text-xl font-semibold">Edit note</h1>
      <p className="mb-6 text-sm text-gray-500">{person.name}</p>
      <EditNoteForm action={updateWithIds} defaultNote={link.encounter_note} />
    </main>
  );
}
