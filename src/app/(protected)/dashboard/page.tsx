import Link from "next/link";

import { signOut } from "@/lib/auth/actions";
import { getDashboardFollowUps } from "@/lib/follow-ups/queries";
import { createClient } from "@/lib/supabase/server";

// Parses YYYY-MM-DD as a local date for display — avoids UTC day-shift.
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { overdue, dueToday, upcoming },
  ] = await Promise.all([
    supabase.auth.getUser(),
    getDashboardFollowUps(supabase),
  ]);

  const hasFollowUps =
    overdue.length + dueToday.length + upcoming.length > 0;

  return (
    <main className="mx-auto max-w-2xl p-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Atlas</h1>
          <p className="mt-0.5 text-sm text-gray-500">{user?.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-gray-400 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* ── Follow-ups ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">Follow-ups</h2>

        {!hasFollowUps && (
          <p className="text-sm text-gray-500">
            No overdue or upcoming follow-ups.
          </p>
        )}

        {overdue.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-red-600">
              Overdue
            </p>
            <ul className="divide-y divide-gray-100 rounded border border-red-200">
              {overdue.map((f) => (
                <li key={f.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/people/${f.people?.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {f.people?.name}
                      </Link>
                      <p className="text-xs text-red-600">
                        {formatDate(f.due_date)}
                      </p>
                      {f.note && (
                        <p className="mt-0.5 text-xs text-gray-500">{f.note}</p>
                      )}
                    </div>
                    <Link
                      href={`/people/${f.people?.id}`}
                      className="shrink-0 text-xs text-gray-400 hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {dueToday.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-700">
              Due today
            </p>
            <ul className="divide-y divide-gray-100 rounded border border-gray-200">
              {dueToday.map((f) => (
                <li key={f.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/people/${f.people?.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {f.people?.name}
                      </Link>
                      {f.note && (
                        <p className="mt-0.5 text-xs text-gray-500">{f.note}</p>
                      )}
                    </div>
                    <Link
                      href={`/people/${f.people?.id}`}
                      className="shrink-0 text-xs text-gray-400 hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Upcoming
            </p>
            <ul className="divide-y divide-gray-100 rounded border border-gray-200">
              {upcoming.map((f) => (
                <li key={f.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/people/${f.people?.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {f.people?.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {formatDate(f.due_date)}
                      </p>
                      {f.note && (
                        <p className="mt-0.5 text-xs text-gray-500">{f.note}</p>
                      )}
                    </div>
                    <Link
                      href={`/people/${f.people?.id}`}
                      className="shrink-0 text-xs text-gray-400 hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <Link
          href="/people"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          People →
        </Link>
        <Link
          href="/events"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Events →
        </Link>
      </div>
    </main>
  );
}
