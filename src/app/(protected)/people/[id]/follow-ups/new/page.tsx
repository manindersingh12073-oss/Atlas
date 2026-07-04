import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoBlockedPage } from "@/components/demo/DemoBlockedPage";
import { FollowUpForm } from "@/components/follow-ups/FollowUpForm";
import { createFollowUp } from "@/lib/follow-ups/actions";
import type { ActionState } from "@/lib/follow-ups/actions";
import { isDemoMode } from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function NewFollowUpPage({ params }: Props) {
  const { id } = await params;

  if (await isDemoMode()) return <DemoBlockedPage backHref={`/people/${id}`} backLabel="Person" />;

  const supabase = await createClient();

  const { data: person } = await supabase
    .from("people")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!person) notFound();

  const createFollowUpWithId = createFollowUp.bind(
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
      <h1 className="mb-6 text-xl font-semibold">Add follow-up</h1>
      <FollowUpForm
        action={createFollowUpWithId}
        submitLabel="Add follow-up"
      />
    </main>
  );
}
