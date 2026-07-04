import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/events/EventForm";
import { updateEvent } from "@/lib/events/actions";
import type { ActionState } from "@/lib/events/actions";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, event_date, location, description")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const updateEventWithId = updateEvent.bind(null, event.id) as (
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
      <h1 className="mb-6 text-xl font-semibold">Edit event</h1>
      <EventForm
        action={updateEventWithId}
        defaultValues={event}
        submitLabel="Save changes"
      />
    </main>
  );
}
