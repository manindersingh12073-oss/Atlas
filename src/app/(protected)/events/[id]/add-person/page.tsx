import Link from "next/link";
import { notFound } from "next/navigation";

import { PersonForm } from "@/components/people/PersonForm";
import { createPersonAndLink } from "@/lib/event-people/actions";
import type { ActionState } from "@/lib/event-people/actions";
import { getCompanySuggestions } from "@/lib/people/queries";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function AddPersonToEventPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [eventResult, companies] = await Promise.all([
    supabase.from("events").select("id, name").eq("id", id).single(),
    getCompanySuggestions(supabase),
  ]);

  if (!eventResult.data) notFound();

  const event = eventResult.data;

  const createPersonAndLinkWithId = createPersonAndLink.bind(
    null,
    event.id,
  ) as (state: ActionState, formData: FormData) => Promise<ActionState>;

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
      <h1 className="mb-1 text-xl font-semibold">Create new person</h1>
      <p className="mb-6 text-sm text-gray-500">
        Will be linked to{" "}
        <span className="font-medium">{event.name}</span> on save.
      </p>
      <PersonForm
        action={createPersonAndLinkWithId}
        submitLabel="Create and link"
        companies={companies}
      />
    </main>
  );
}
