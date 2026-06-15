import Link from "next/link";
import { notFound } from "next/navigation";

import { DeletePersonButton } from "@/components/people/DeletePersonButton";
import { deletePerson } from "@/lib/people/actions";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = { params: Promise<{ id: string }> };

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: person } = await supabase
    .from("people")
    .select("id, name, company, role, linkedin_url, email, phone, notes, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!person) notFound();

  const deletePersonWithId = deletePerson.bind(null, person.id);

  const contactFields = [
    { label: "Email", value: person.email },
    { label: "Phone", value: person.phone },
    { label: "LinkedIn", value: person.linkedin_url },
  ].filter((f) => f.value);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/people" className="text-sm text-gray-500 hover:underline">
          ← People
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{person.name}</h1>
          {(person.role || person.company) && (
            <p className="mt-0.5 text-sm text-gray-500">
              {[person.role, person.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/people/${person.id}/edit`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeletePersonButton deleteAction={deletePersonWithId} />
        </div>
      </div>

      <dl className="divide-y divide-gray-100 rounded border border-gray-200">
        {contactFields.map(({ label, value }) => (
          <div key={label} className="px-4 py-3">
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="mt-0.5 text-sm break-all">{value}</dd>
          </div>
        ))}

        {person.notes && (
          <div className="px-4 py-3">
            <dt className="text-xs font-medium text-gray-500">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm">{person.notes}</dd>
          </div>
        )}

        <div className="px-4 py-3">
          <dt className="text-xs font-medium text-gray-500">Added</dt>
          <dd className="mt-0.5 text-sm text-gray-600">{formatDate(person.created_at)}</dd>
        </div>

        <div className="px-4 py-3">
          <dt className="text-xs font-medium text-gray-500">Last updated</dt>
          <dd className="mt-0.5 text-sm text-gray-600">{formatDate(person.updated_at)}</dd>
        </div>
      </dl>
    </main>
  );
}
