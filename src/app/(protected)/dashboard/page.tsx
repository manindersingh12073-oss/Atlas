import Link from "next/link";

import { CompleteFollowUpButton } from "@/components/follow-ups/CompleteFollowUpButton";
import { CompletedFollowUpsSection } from "@/components/follow-ups/CompletedFollowUpsSection";
import { DeleteFollowUpButton } from "@/components/follow-ups/DeleteFollowUpButton";
import { RescheduleFollowUpButtons } from "@/components/follow-ups/RescheduleFollowUpButtons";
import { CurrentConferenceCard } from "@/components/dashboard/CurrentConferenceCard";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
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
import { getDashboardData } from "@/lib/dashboard/queries";
import { getSearchSuggestions } from "@/lib/search/queries";
import { UniversalSearchBar } from "@/components/search/UniversalSearchBar";
import { createClient } from "@/lib/supabase/server";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavStatCard({
  label,
  value,
  subtitle,
  href,
}: {
  label: string;
  value: number;
  subtitle: string | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-[#1c2230]"
    >
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
      {subtitle && (
        <p className="mt-1 truncate text-xs text-gray-400">{subtitle}</p>
      )}
    </Link>
  );
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { stats, insights, recentPeople },
    { overdue, dueToday, upcoming },
    done,
    conference,
    suggestions,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getDashboardData(supabase),
    getDashboardFollowUps(supabase),
    getDoneFollowUps(supabase),
    getCurrentConference(supabase),
    getSearchSuggestions(supabase),
  ]);

  const hasActive = overdue.length + dueToday.length + upcoming.length > 0;

  return (
    <main className="mx-auto max-w-[62rem] p-6">

      {/* ── Network stats ────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NavStatCard
            label="People"
            value={stats.peopleCount}
            subtitle={stats.peopleAddedThisWeek > 0 ? `${stats.peopleAddedThisWeek} added this week` : null}
            href="/people"
          />
          <NavStatCard
            label="Events"
            value={stats.eventsCount}
            subtitle={stats.lastEventName ? `Last: ${stats.lastEventName}` : null}
            href="/events"
          />
          <NavStatCard
            label="Relationships"
            value={stats.relationshipsCount}
            subtitle={stats.relationshipsAddedThisWeek > 0 ? `${stats.relationshipsAddedThisWeek} added this week` : null}
            href="/people"
          />
          <NavStatCard
            label="Pending follow-ups"
            value={stats.pendingFollowUpsCount}
            subtitle={overdue.length > 0 ? `${overdue.length} overdue` : null}
            href="#follow-ups"
          />
        </div>

        {/* ── Global network search ──────────────────────────────────── */}
        <div className="mt-4">
          <UniversalSearchBar suggestions={suggestions} />
        </div>
      </section>

      {/* ── Onboarding checklist (first-time users) ─────────────────── */}
      <OnboardingChecklist
        peopleCount={stats.peopleCount}
        eventsCount={stats.eventsCount}
        followUpsEver={stats.pendingFollowUpsCount + insights.completedFollowUpsCount}
        relationshipsCount={stats.relationshipsCount}
      />

      {/* ── Current conference (primary action when active) ─────────── */}
      {conference && <CurrentConferenceCard conference={conference} />}

      {/* ── Network activity ─────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Network Activity</h2>
          <Link href="/people" className="text-xs text-gray-500 hover:underline">
            View all →
          </Link>
        </div>

        {recentPeople.length > 0 ? (
          <ul className="divide-y divide-gray-100 rounded border border-gray-200">
            {recentPeople.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/people/${person.id}`}
                  className="flex items-start justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1c2230]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{person.name}</p>
                    {person.company && (
                      <p className="text-xs text-gray-500">{person.company}</p>
                    )}
                  </div>
                  <p className="shrink-0 pl-4 text-xs text-gray-400">
                    {formatTimestamp(person.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No people added yet.{" "}
            <Link href="/people/new" className="underline">
              Add your first person.
            </Link>
          </p>
        )}
      </section>

      {/* ── Follow-ups ──────────────────────────────────────────────── */}
      <section className="mb-8" id="follow-ups">
        <h2 className="mb-3 text-base font-semibold">Follow-ups</h2>

        {!hasActive && (
          <p className="text-sm text-gray-500">
            No overdue or upcoming follow-ups.{" "}
            {stats.peopleCount > 0 && (
              <Link href="/people" className="underline">
                Open a contact to add one.
              </Link>
            )}
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

    </main>
  );
}
