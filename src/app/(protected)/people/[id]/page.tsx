import Link from "next/link";
import { notFound } from "next/navigation";

import { CompleteFollowUpButton } from "@/components/follow-ups/CompleteFollowUpButton";
import { DeleteFollowUpButton } from "@/components/follow-ups/DeleteFollowUpButton";
import { RescheduleFollowUpButtons } from "@/components/follow-ups/RescheduleFollowUpButtons";
import { UncompleteFollowUpButton } from "@/components/follow-ups/UncompleteFollowUpButton";
import { DeletePersonButton } from "@/components/people/DeletePersonButton";
import { RemovePersonButton } from "@/components/event-people/RemovePersonButton";
import { PersonTimeline } from "@/components/people/PersonTimeline";
import { RecordPersonView } from "@/components/people/RecordPersonView";
import { RelationshipPicker } from "@/components/relationships/RelationshipPicker";
import { RemoveRelationshipButton } from "@/components/relationships/RemoveRelationshipButton";
import { TagChip } from "@/components/tags/TagChip";
import { TagPicker } from "@/components/tags/TagPicker";
import { completeFollowUp, deleteFollowUp, snoozeFollowUp, uncompleteFollowUp } from "@/lib/follow-ups/actions";
import type { FollowUp } from "@/lib/follow-ups/queries";
import { deletePerson } from "@/lib/people/actions";
import { removeEventFromPerson } from "@/lib/event-people/actions";
import { removeRelationship } from "@/lib/relationships/actions";
import { getDisplayLabel, getPersonRelationships } from "@/lib/relationships/queries";
import { removeTagFromPerson } from "@/lib/tags/actions";
import { buildTimeline } from "@/lib/people/timeline";
import { getPersonTags, getTagsWithCounts } from "@/lib/tags/queries";
import { getRecentPeople } from "@/lib/capture/queries";
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

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Parses YYYY-MM-DD as a local date to avoid UTC day-shift in negative-offset timezones.
function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Shape returned by the nested select on event_people.
type EventLink = {
  created_at: string;
  encounter_note: string | null;
  events: {
    id: string;
    name: string;
    event_date: string | null;
    location: string | null;
  } | null;
};

type Props = { params: Promise<{ id: string }> };

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [personResult, eventLinksResult, followUpsResult, personTags, allTagsWithCounts, relationships, recentPeople] =
    await Promise.all([
      supabase
        .from("people")
        .select(
          "id, name, company, role, linkedin_url, email, phone, notes, created_at, updated_at",
        )
        .eq("id", id)
        .single(),
      supabase
        .from("event_people")
        .select("encounter_note, created_at, events(id, name, event_date, location)")
        .eq("person_id", id),
      supabase
        .from("follow_ups")
        .select("id, person_id, due_date, note, status, completed_at, created_at, updated_at")
        .eq("person_id", id)
        .order("due_date", { ascending: true }),
      getPersonTags(supabase, id),
      getTagsWithCounts(supabase),
      getPersonRelationships(supabase, id),
      getRecentPeople(supabase),
    ]);

  if (!personResult.data) notFound();

  const person = personResult.data;
  const deletePersonWithId = deletePerson.bind(null, person.id);

  const allFollowUps = (followUpsResult.data ?? []) as (FollowUp & { updated_at: string })[];
  const today = new Date().toISOString().split("T")[0];
  const activeFollowUps = allFollowUps.filter((f) => f.status !== "done");
  const doneFollowUps = allFollowUps.filter((f) => f.status === "done");

  const eventLinks = ((eventLinksResult.data ?? []) as EventLink[]).sort(
    (a, b) => {
      const dateA = a.events?.event_date ?? null;
      const dateB = b.events?.event_date ?? null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.localeCompare(dateA);
    },
  );

  const timeline = buildTimeline(person, eventLinks, allFollowUps, relationships);

  const contactFields = [
    { label: "Email", value: person.email },
    { label: "Phone", value: person.phone },
    { label: "LinkedIn", value: person.linkedin_url },
  ].filter((f) => f.value);

  return (
    <main className="mx-auto max-w-[62rem] p-6">
      <RecordPersonView
        id={person.id}
        name={person.name}
        company={person.company}
      />
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
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {personTags.map((tag) => (
              <TagChip
                key={tag.id}
                tag={tag}
                onRemove={removeTagFromPerson.bind(null, person.id, tag.id)}
              />
            ))}
            <TagPicker
              personId={person.id}
              allTags={allTagsWithCounts}
              personTagIds={personTags.map((t) => t.id)}
            />
          </div>
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
          <dd className="mt-0.5 text-sm text-gray-600">
            {formatTimestamp(person.created_at)}
          </dd>
        </div>

        <div className="px-4 py-3">
          <dt className="text-xs font-medium text-gray-500">Last updated</dt>
          <dd className="mt-0.5 text-sm text-gray-600">
            {formatTimestamp(person.updated_at)}
          </dd>
        </div>
      </dl>

      {/* ── Events section ─────────────────────────────────────────── */}
      <section className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">
            Events{" "}
            <span className="text-sm font-normal text-gray-500">
              ({eventLinks.length})
            </span>
          </h2>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/people/${person.id}/link-event`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Link existing event
            </Link>
            <Link
              href={`/people/${person.id}/add-event`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Create new event
            </Link>
          </div>
        </div>

        {eventLinks.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Not linked to any events yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200">
            {eventLinks.map((link) => {
              if (!link.events) return null;
              const event = link.events;
              const removeAction = removeEventFromPerson.bind(
                null,
                person.id,
                event.id,
              );
              return (
                <li key={event.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/events/${event.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {event.name}
                      </Link>
                      {event.event_date && (
                        <p className="text-xs text-gray-500">
                          {formatEventDate(event.event_date)}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      )}
                      {link.encounter_note && (
                        <p className="mt-1 text-xs italic text-gray-500">
                          {link.encounter_note}
                        </p>
                      )}
                    </div>
                    <RemovePersonButton
                      removeAction={removeAction}
                      confirmMessage="Remove this event from the person's history?"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Follow-ups section ─────────────────────────────────────────── */}
      <section className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">
            Follow-ups{" "}
            <span className="text-sm font-normal text-gray-500">
              ({activeFollowUps.length})
            </span>
          </h2>
          <Link
            href={`/people/${person.id}/follow-ups/new`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Add follow-up
          </Link>
        </div>

        {allFollowUps.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No follow-ups yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200">
            {activeFollowUps.map((f) => {
              const isOverdue = f.status !== "done" && f.due_date < today;
              const redirectTo = `/people/${person.id}`;
              const completeAction = completeFollowUp.bind(null, f.id, redirectTo);
              const tomorrowAction = snoozeFollowUp.bind(null, f.id, redirectTo, "1d");
              const sevenDayAction = snoozeFollowUp.bind(null, f.id, redirectTo, "7d");
              const thirtyDayAction = snoozeFollowUp.bind(null, f.id, redirectTo, "30d");
              const deleteAction = deleteFollowUp.bind(null, f.id, redirectTo);
              return (
                <li key={f.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${isOverdue ? "text-red-600" : ""}`}
                      >
                        {formatDate(f.due_date)}
                        {f.status === "snoozed" && (
                          <span className="ml-2 text-xs font-normal text-amber-600">
                            snoozed
                          </span>
                        )}
                        {isOverdue && (
                          <span className="ml-2 text-xs font-normal">
                            overdue
                          </span>
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
                      href={`/people/${person.id}/follow-ups/${f.id}/edit`}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteFollowUpButton deleteAction={deleteAction} />
                  </div>
                </li>
              );
            })}
            {doneFollowUps.map((f) => {
              const redirectTo = `/people/${person.id}`;
              const uncompleteAction = uncompleteFollowUp.bind(null, f.id, redirectTo);
              const deleteAction = deleteFollowUp.bind(null, f.id, redirectTo);
              return (
                <li key={f.id} className="px-4 py-3 opacity-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm line-through">{formatDate(f.due_date)}</p>
                      {f.note && (
                        <p className="mt-0.5 text-xs text-gray-500">{f.note}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <UncompleteFollowUpButton uncompleteAction={uncompleteAction} />
                      <DeleteFollowUpButton deleteAction={deleteAction} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Relationships section ──────────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Relationships</h2>
        {relationships.length === 0 && (
          <p className="mb-3 text-xs text-gray-400">
            No relationships recorded. Use the picker below to connect{" "}
            <span className="font-medium">{person.name}</span> to others in your network.
          </p>
        )}
        {relationships.length > 0 && (
          <ul className="mb-3 divide-y divide-gray-100 rounded border border-gray-200">
            {relationships.map((rel) => {
              const isPersonA = rel.person_a === person.id;
              const other = isPersonA ? rel.b : rel.a;
              const label = getDisplayLabel(
                rel.type as Parameters<typeof getDisplayLabel>[0],
                isPersonA,
                other?.name ?? "",
              );
              const removeAction = removeRelationship.bind(
                null,
                rel.id,
                rel.person_a,
                rel.person_b,
              );
              return (
                <li key={rel.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700">{label}</p>
                    {other && (
                      <Link
                        href={`/people/${other.id}`}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        {other.name}
                      </Link>
                    )}
                  </div>
                  <RemoveRelationshipButton removeAction={removeAction} />
                </li>
              );
            })}
          </ul>
        )}
        <RelationshipPicker
          personId={person.id}
          recentPeople={recentPeople}
          redirectTo={`/people/${person.id}`}
        />
      </section>

      <PersonTimeline items={timeline} />
    </main>
  );
}
