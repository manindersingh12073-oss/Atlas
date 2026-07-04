import Link from "next/link";
import { notFound } from "next/navigation";

import { PersonForm } from "@/components/people/PersonForm";
import { updatePerson } from "@/lib/people/actions";
import type { ActionState } from "@/lib/people/actions";
import { getCompanySuggestions } from "@/lib/people/queries";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: person }, companies] = await Promise.all([
    supabase
      .from("people")
      .select("id, name, company, role, linkedin_url, email, phone, notes")
      .eq("id", id)
      .single(),
    getCompanySuggestions(supabase),
  ]);

  if (!person) notFound();

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
        companies={companies}
        excludeId={person.id}
      />
    </main>
  );
}
