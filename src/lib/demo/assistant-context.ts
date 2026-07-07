// Demo-Mode equivalents of the Atlas Copilot context functions in
// src/lib/assistant/context/ — same recipe, same return shapes, computed
// over the in-memory demo dataset instead of Supabase. Mirrors the adapter
// pattern already used by every other Demo Mode page (src/lib/demo/queries.ts).
// searchNetworkDemo/getDashboardDataDemo/getNetworkGraphDataDemo already
// exist there and are reused directly — only the composite functions below
// (getPersonFull/getEventFull/getReconnectionSuggestions/getUserContext
// equivalents) are new.

import { buildTimeline } from "@/lib/people/timeline";
import { getDisplayLabel, type PersonRelationship } from "@/lib/relationships/queries";
import type { PersonFull } from "@/lib/assistant/context/people";
import type { EventFull } from "@/lib/assistant/context/events";
import type {
  OverdueFollowUp,
  ReconnectionCandidate,
  ReconnectionSuggestions,
} from "@/lib/assistant/context/insights";
import type { UserContext } from "@/lib/assistant/context/userContext";
import { demoDataset } from "./dataset";
import {
  getDashboardDataDemo,
  getDashboardFollowUpsDemo,
  getEventPersonLinksDemo,
  getEventRecordDemo,
  getNetworkGraphDataDemo,
  getPersonEventLinksDemo,
  getPersonFollowUpsDemo,
  getPersonRecordDemo,
  getPersonRelationshipsDemo,
  getPersonTagsDemo,
} from "./queries";

export function getPersonFullDemo(personId: string): PersonFull | null {
  const person = getPersonRecordDemo(personId);
  if (!person) return null;

  const tags = getPersonTagsDemo(personId);
  const relationships = getPersonRelationshipsDemo(personId);
  const followUps = getPersonFollowUpsDemo(personId);
  const eventLinks = getPersonEventLinksDemo(personId);

  const events = eventLinks
    .filter((l): l is typeof l & { events: NonNullable<typeof l.events> } => l.events !== null)
    .map((l) => ({
      event_id: l.events.id,
      event_name: l.events.name,
      event_date: l.events.event_date,
      location: l.events.location,
      encounter_note: l.encounter_note,
    }));

  const timeline = buildTimeline(
    { id: person.id, created_at: person.created_at },
    eventLinks,
    followUps.map((f) => ({ ...f, updated_at: f.created_at })),
    relationships as unknown as Parameters<typeof buildTimeline>[3],
  );

  const relationshipSummaries = relationships.map((rel: PersonRelationship) => {
    const isPersonA = rel.person_a === person.id;
    const other = isPersonA ? rel.b : rel.a;
    return {
      label: getDisplayLabel(rel.type, isPersonA, other?.name ?? ""),
      otherPersonId: other?.id ?? "",
      otherPersonName: other?.name ?? "",
      type: rel.type,
    };
  });

  return {
    person,
    tags: tags.map((t) => ({ id: t.id, name: t.name })),
    relationships: relationshipSummaries,
    followUps: followUps.map((f) => ({ id: f.id, due_date: f.due_date, note: f.note, status: f.status })),
    events,
    timeline,
  };
}

export function getEventFullDemo(eventId: string): EventFull | null {
  const event = getEventRecordDemo(eventId);
  if (!event) return null;

  const attendees = getEventPersonLinksDemo(eventId)
    .map((l) => l.people)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return { event, attendees };
}

/** Same recipe as the real getReconnectionSuggestions() — event-link recency + dashboard follow-ups. */
export function getReconnectionSuggestionsDemo(limit = 10): ReconnectionSuggestions {
  const dashboardFollowUps = getDashboardFollowUpsDemo();

  const latestByPerson = new Map<string, { name: string; company: string | null; lastDate: string }>();
  for (const ep of demoDataset.eventPeople) {
    const event = demoDataset.eventsById.get(ep.event_id);
    const person = demoDataset.peopleById.get(ep.person_id);
    const date = event?.event_date;
    if (!date || !person) continue;
    const existing = latestByPerson.get(person.id);
    if (!existing || date > existing.lastDate) {
      latestByPerson.set(person.id, { name: person.name, company: person.company, lastDate: date });
    }
  }

  const today = new Date();
  const stale: ReconnectionCandidate[] = [...latestByPerson.entries()]
    .map(([personId, v]) => {
      const [y, m, d] = v.lastDate.split("-").map(Number);
      const days = Math.floor((today.getTime() - new Date(y, m - 1, d).getTime()) / (1000 * 60 * 60 * 24));
      return {
        personId,
        personName: v.name,
        company: v.company,
        lastContactDate: v.lastDate,
        daysSinceContact: days,
      };
    })
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
    .slice(0, limit);

  const overdueFollowUps: OverdueFollowUp[] = dashboardFollowUps.overdue
    .filter((f) => f.people)
    .map((f) => ({
      personId: f.people!.id,
      personName: f.people!.name,
      dueDate: f.due_date,
      note: f.note,
    }));

  return { stale, overdueFollowUps };
}

export function getNetworkInsightsDemo() {
  const dashboard = getDashboardDataDemo();
  const graph = getNetworkGraphDataDemo();
  return { ...dashboard, graphStats: graph.stats };
}

/**
 * No real Atlas Memory exists for an anonymous demo visitor — returns one
 * canned illustrative goal (thematically consistent with the showcase
 * dataset's AI/healthcare communities) so demo suggestions have something
 * concrete to reference, rather than an empty context.
 */
export function getUserContextDemo(): UserContext {
  return {
    goals: ["Meet more people in AI and healthcare"],
    preferences: [],
    notes: [],
  };
}
