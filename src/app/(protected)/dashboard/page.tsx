import Link from "next/link";

import { CompleteFollowUpButton } from "@/components/follow-ups/CompleteFollowUpButton";
import { CompletedFollowUpsSection } from "@/components/follow-ups/CompletedFollowUpsSection";
import { DeleteFollowUpButton } from "@/components/follow-ups/DeleteFollowUpButton";
import { RescheduleFollowUpButtons } from "@/components/follow-ups/RescheduleFollowUpButtons";
import { signOut } from "@/lib/auth/actions";
import {
  completeFollowUp,
  deleteFollowUp,
  snoozeFollowUp,
  uncompleteFollowUp,
} from "@/lib/follow-ups/actions";
import {
  getDashboardFollowUps,
  getDoneFollowUps,
} from "@/lib/follow-ups/queries";
import type { FollowUpWithPerson } from "@/lib/follow-ups/queries";
import { getCurrentConference } from "@/lib/capture/queries";
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

function FollowUpCard({ f, groupColor }: { f: FollowUpWithPerson; groupColor?: string }) {
  const redirectTo = "/dashboard";
  const completeAction = completeFollowUp.bind(null, f.id, redirectTo);
  const deleteAction = deleteFollowUp.bind(null, f.id, redirectTo);
  const tomorrowAction = snoozeFollowUp.bind(null, f.id, redirectTo, "1d");
  const sevenDayAction = snoozeFollowUp.bind(null, f.id, redirectTo, "7d");
  const thirtyDayAction = snoozeFollowUp.bind(null, f.id, redirectTo, "30d");

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/people/${f.people?.id}`}
            className="text-sm font-medium hover:underline"
          >
            {f.people?.name}
          </Link>
          <p className={`text-xs ${groupColor ?? "text-gray-500"}`}>
            {formatDate(f.due_date)}
            {f.status === "snoozed" && (
              <span className="ml-2 text-amber-600">snoozed</span>
            )}
          </p>
          {f.note && (
            <p className="mt-0.5 text-xs text-gray-500">{f.note}</p>
          )}
        </div>
        <CompleteFollowUpButton completeAction={completeAction} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <RescheduleFollowUpButtons
          tomorrowAction={tomorrowAction}
          sevenDayAction={sevenDayAction}
          thirtyDayAction={thirtyDayAction}
        />
        <Link
          href={`/people/${f.people?.id}/follow-ups/${f.id}/edit?returnTo=/dashboard`}
          className="text-xs text-gray-500 hover:underline"
        >
          Edit
        </Link>
        <DeleteFollowUpButton deleteAction={deleteAction} />
      </div>
    </li>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { overdue, dueToday, upcoming },
    done,
    conference,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getDashboardFollowUps(supabase),
    getDoneFollowUps(supabase),
    getCurrentConference(supabase),
  ]);

  const hasActive = overdue.length + dueToday.length + upcoming.length > 0;

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

      {/* ── Current conference (primary action when active) ─────────── */}
      {conference && (
        <section className="mb-8 rounded border border-gray-200 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            Current conference
          </p>
          {conference.eventName ? (
            <h2 className="text-base font-semibold">{conference.eventName}</h2>
          ) : (
            <h2 className="text-base font-semibold text-gray-500">No event selected</h2>
          )}
          <p className="mt-0.5 text-sm text-gray-500">
            Captured today: {conference.capturedCount}
          </p>
          {conference.recentCaptures.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {conference.recentCaptures.map((p) => (
                <li key={p.id} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="text-xs text-green-500">✓</span>
                  <Link href={`/people/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={
              conference.eventId
                ? `/events/${conference.eventId}/capture`
                : "/capture"
            }
            className="mt-4 block rounded border border-gray-800 bg-gray-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700"
          >
            Continue →
          </Link>
        </section>
      )}

      {/* ── Follow-ups ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">Follow-ups</h2>

        {!hasActive && (
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
                <FollowUpCard key={f.id} f={f} groupColor="text-red-600" />
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
                <FollowUpCard key={f.id} f={f} />
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
                <FollowUpCard key={f.id} f={f} />
              ))}
            </ul>
          </div>
        )}

        <CompletedFollowUpsSection
          items={done.map((f) => ({
            ...f,
            uncompleteAction: uncompleteFollowUp.bind(null, f.id, "/dashboard"),
          }))}
        />
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
        <Link
          href="/capture"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Capture →
        </Link>
      </div>
    </main>
  );
}
