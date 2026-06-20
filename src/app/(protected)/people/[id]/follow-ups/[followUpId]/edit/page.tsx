import Link from "next/link";
import { notFound } from "next/navigation";

import { FollowUpForm } from "@/components/follow-ups/FollowUpForm";
import { updateFollowUp } from "@/lib/follow-ups/actions";
import type { ActionState } from "@/lib/follow-ups/actions";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string; followUpId: string }> };

export default async function EditFollowUpPage({ params }: Props) {
  const { id, followUpId } = await params;
  const supabase = await createClient();

  const [personResult, followUpResult] = await Promise.all([
    supabase.from("people").select("id, name").eq("id", id).single(),
    supabase
      .from("follow_ups")
      .select("id, due_date, note, status")
      .eq("id", followUpId)
      .eq("person_id", id)
      .single(),
  ]);

  if (!personResult.data || !followUpResult.data) notFound();

  const person = personResult.data;
  const followUp = followUpResult.data;

  const updateFollowUpWithIds = updateFollowUp.bind(
    null,
    followUp.id,
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
      <h1 className="mb-6 text-xl font-semibold">Edit follow-up</h1>
      <FollowUpForm
        action={updateFollowUpWithIds}
        defaultValues={{
          due_date: followUp.due_date,
          note: followUp.note,
        }}
      />
    </main>
  );
}
