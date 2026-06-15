import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: people } = await supabase
    .from("people")
    .select("id, name, company, role")
    .order("name");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">People</h1>
        <Link
          href="/people/new"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Add person
        </Link>
      </div>

      {people && people.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded border border-gray-200">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                href={`/people/${person.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">{person.name}</p>
                  {(person.company || person.role) && (
                    <p className="text-xs text-gray-500">
                      {[person.role, person.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-gray-400 text-sm">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">
          No people yet.{" "}
          <Link href="/people/new" className="underline">
            Add your first person.
          </Link>
        </p>
      )}
    </main>
  );
}
