import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoBlockedPage } from "@/components/demo/DemoBlockedPage";
import { FollowUpForm } from "@/components/follow-ups/FollowUpForm";
import { updateFollowUp } from "@/lib/follow-ups/actions";
import type { ActionState } from "@/lib/follow-ups/actions";
import { isDemoMode } from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";

// Only /dashboard is allowed as an external returnTo to prevent open redirects.
const ALLOWED_RETURN_PATHS = new Set(["/dashboard"]);

type Props = {
  params: Promise<{ id: string; followUpId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function EditFollowUpPage({ params, searchParams }: Props) {
  const { id, followUpId } = await params;
  const { returnTo } = await searchParams;

  if (await isDemoMode()) return <DemoBlockedPage backHref={`/people/${id}`} backLabel="Person" />;

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

  const redirectTo =
    returnTo && ALLOWED_RETURN_PATHS.has(returnTo)
      ? returnTo
      : `/people/${person.id}`;

  const updateFollowUpWithIds = updateFollowUp.bind(
    null,
    followUp.id,
    redirectTo,
  ) as (state: ActionState, formData: FormData) => Promise<ActionState>;

  const backLabel =
    redirectTo === "/dashboard" ? "Dashboard" : person.name;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link
          href={redirectTo}
          className="text-sm text-gray-500 hover:underline"
        >
          ← {backLabel}
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
