import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoBlockedPage } from "@/components/demo/DemoBlockedPage";
import { EventForm } from "@/components/events/EventForm";
import { createEventAndLink } from "@/lib/event-people/actions";
import type { ActionState } from "@/lib/event-people/actions";
import { isDemoMode } from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function AddEventToPersonPage({ params }: Props) {
  const { id } = await params;

  if (await isDemoMode()) return <DemoBlockedPage backHref={`/people/${id}`} backLabel="Person" />;

  const supabase = await createClient();

  const { data: person } = await supabase
    .from("people")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!person) notFound();

  const createEventAndLinkWithId = createEventAndLink.bind(
    null,
    person.id,
  ) as (state: ActionState, formData: FormData) => Promise<ActionState>;

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
      <h1 className="mb-1 text-xl font-semibold">Create new event</h1>
      <p className="mb-6 text-sm text-gray-500">
        Will be linked to{" "}
        <span className="font-medium">{person.name}</span> on save.
      </p>
      <EventForm
        action={createEventAndLinkWithId}
        submitLabel="Create and link"
      />
    </main>
  );
}
