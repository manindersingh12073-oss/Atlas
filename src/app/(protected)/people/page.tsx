import Link from "next/link";

import { PeopleSearchInput } from "@/components/people/PeopleSearchInput";
import { searchPeople } from "@/lib/people/queries";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PeoplePage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createClient();
  const people = await searchPeople(supabase, query);
  const hasQuery = query.length > 0;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">People</h1>
        <Link
          href="/people/new"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Add person
        </Link>
      </div>

      {/* Search — form wrapper keeps Enter-key submission working as a
          native GET fallback; real-time updates are driven by PeopleSearchInput. */}
      <form method="GET" action="/people" className="mb-6">
        <PeopleSearchInput defaultValue={query} />
        {hasQuery && (
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {people.length}{" "}
              {people.length === 1 ? "result" : "results"} for{" "}
              <span className="font-medium">&ldquo;{query}&rdquo;</span>
            </p>
            <Link href="/people" className="text-xs text-gray-500 hover:underline">
              Clear search
            </Link>
          </div>
        )}
      </form>

      {people.length > 0 ? (
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
                <span className="text-sm text-gray-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : hasQuery ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            No people found matching{" "}
            <span className="font-medium">&ldquo;{query}&rdquo;</span>.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/people/new?name=${encodeURIComponent(query)}`}
              className="rounded border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Add &ldquo;{query}&rdquo;
            </Link>
            <Link href="/people" className="text-sm text-gray-500 hover:underline">
              Clear search
            </Link>
          </div>
        </div>
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
