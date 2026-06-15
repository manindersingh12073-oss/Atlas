import Link from "next/link";
import { notFound } from "next/navigation";

import { PersonForm } from "@/components/people/PersonForm";
import { updatePerson } from "@/lib/people/actions";
import type { ActionState } from "@/lib/people/actions";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: person } = await supabase
    .from("people")
    .select("id, name, company, role, linkedin_url, email, phone, notes")
    .eq("id", id)
    .single();

  if (!person) notFound();

  // Bind the id so the action signature matches what PersonForm (useActionState) expects.
  const updatePersonWithId = updatePerson.bind(null, person.id) as (
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;

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
      <h1 className="mb-6 text-xl font-semibold">Edit person</h1>
      <PersonForm
        action={updatePersonWithId}
        defaultValues={person}
        submitLabel="Save changes"
      />
    </main>
  );
}
