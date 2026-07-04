import { demoDataset } from "@/lib/demo/dataset";
import type { DemoFollowUp } from "@/lib/demo/dataset";
import type { PeopleSort, PersonEventData } from "@/lib/people/queries";
import type { EventSort, EventWithCount } from "@/lib/events/queries";
import type { Tag, TagWithCount } from "@/lib/tags/queries";
import type { FollowUp, FollowUpWithPerson, DashboardFollowUps } from "@/lib/follow-ups/queries";
import type { PersonRelationship, RelationshipType } from "@/lib/relationships/queries";
import type { DashboardData } from "@/lib/dashboard/queries";
import type { SearchResults, SearchSuggestions, SearchEvent } from "@/lib/search/queries";
import type { NetworkGraphData, GraphNode, GraphEdge } from "@/lib/graph/queries";
import type { NodeDetail } from "@/lib/graph/detail";
import type { ConferenceStatus } from "@/lib/capture/queries";
import type { ExportData } from "@/lib/export/queries";

// Pure-JS mirrors of every Supabase-backed query Atlas pages use, operating
// over the in-memory demo dataset instead of the database. Same function
// names (suffixed `Demo`) and return shapes as their real counterparts, so
// pages only need to branch on *which* function to call — never on how to
// shape the result.

const { people, events, eventPeople, tags, personTags, followUps, relationships } = demoDataset;

// ── People ────────────────────────────────────────────────────────────────────

type PersonResult = { id: string; name: string; company: string | null; role: string | null };

function toPersonResult(p: (typeof people)[number]): PersonResult {
  return { id: p.id, name: p.name, company: p.company, role: p.role };
}

function sortPeople(list: PersonResult[], sort: PeopleSort): PersonResult[] {
  const byId = demoDataset.peopleById;
  const withDates = (id: string) => byId.get(id)!;
  const sorted = [...list];
  switch (sort) {
    case "name_desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "created_desc":
      return sorted.sort((a, b) => withDates(b.id).created_at.localeCompare(withDates(a.id).created_at));
    case "created_asc":
      return sorted.sort((a, b) => withDates(a.id).created_at.localeCompare(withDates(b.id).created_at));
    case "updated_desc":
      return sorted.sort((a, b) => withDates(b.id).updated_at.localeCompare(withDates(a.id).updated_at));
    default: // name_asc + events_desc (events_desc is JS-sorted by the caller, same as production)
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function searchPeopleDemo(query: string, sort: PeopleSort): PersonResult[] {
  const q = query.trim().toLowerCase();
  const all = people.map(toPersonResult);

  if (!q) return sortPeople(all, sort);

  const ranked = new Map<string, { person: PersonResult; rank: number }>();
  const consider = (person: PersonResult, rank: number) => {
    const existing = ranked.get(person.id);
    if (!existing || rank < existing.rank) ranked.set(person.id, { person, rank });
  };

  const tagNameById = new Map(tags.map((t) => [t.id, t.name.toLowerCase()]));
  const eventNameById = new Map(events.map((e) => [e.id, e.name.toLowerCase()]));

  for (const p of people) {
    const name = p.name.toLowerCase();
    if (name === q) consider(toPersonResult(p), 0);
    else if (name.includes(q)) consider(toPersonResult(p), 1);
    if (p.company?.toLowerCase().includes(q)) consider(toPersonResult(p), 2);
    if (p.notes?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q))
      consider(toPersonResult(p), 6);
  }

  for (const pt of personTags) {
    if (tagNameById.get(pt.tag_id)?.includes(q)) {
      const p = demoDataset.peopleById.get(pt.person_id);
      if (p) consider(toPersonResult(p), 3);
    }
  }

  for (const ep of eventPeople) {
    if (eventNameById.get(ep.event_id)?.includes(q)) {
      const p = demoDataset.peopleById.get(ep.person_id);
      if (p) consider(toPersonResult(p), 4);
    }
  }

  const nameMatchIds = new Set(
    people.filter((p) => p.name.toLowerCase().includes(q)).map((p) => p.id),
  );
  if (nameMatchIds.size > 0) {
    for (const rel of relationships) {
      const other = nameMatchIds.has(rel.person_a)
        ? demoDataset.peopleById.get(rel.person_b)
        : nameMatchIds.has(rel.person_b)
          ? demoDataset.peopleById.get(rel.person_a)
          : null;
      if (other) consider(toPersonResult(other), 5);
    }
  }

  return [...ranked.values()]
    .sort((a, b) => a.rank - b.rank || a.person.name.localeCompare(b.person.name))
    .map((r) => r.person);
}

export function getPersonEventDataDemo(): Map<string, PersonEventData> {
  const grouped = new Map<string, { id: string; name: string; event_date: string | null }[]>();
  for (const link of eventPeople) {
    const e = demoDataset.eventsById.get(link.event_id);
    if (!e) continue;
    const existing = grouped.get(link.person_id) ?? [];
    existing.push({ id: e.id, name: e.name, event_date: e.event_date });
    grouped.set(link.person_id, existing);
  }

  const result = new Map<string, PersonEventData>();
  for (const [personId, evts] of grouped) {
    const sorted = [...evts].sort((a, b) => {
      if (!a.event_date && !b.event_date) return 0;
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return b.event_date.localeCompare(a.event_date);
    });
    result.set(personId, { event_count: sorted.length, recent_events: sorted.slice(0, 2) });
  }
  return result;
}

export function getCompanySuggestionsDemo(): string[] {
  const freq = new Map<string, number>();
  for (const p of people) {
    if (!p.company) continue;
    freq.set(p.company, (freq.get(p.company) ?? 0) + 1);
  }
  const best = new Map<string, string>();
  for (const [company, count] of freq) {
    const key = company.toLowerCase();
    const current = best.get(key);
    if (!current || count > (freq.get(current) ?? 0)) best.set(key, company);
  }
  return [...best.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export function getRecentPeopleDemo(limit = 10): { id: string; name: string; company: string | null }[] {
  return [...people]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((p) => ({ id: p.id, name: p.name, company: p.company }));
}

// ── Events ────────────────────────────────────────────────────────────────────

function peopleCountByEvent(): Map<string, number> {
  const map = new Map<string, number>();
  for (const link of eventPeople) map.set(link.event_id, (map.get(link.event_id) ?? 0) + 1);
  return map;
}

export function getEventsDemo(sort: EventSort): EventWithCount[] {
  const countMap = peopleCountByEvent();
  const withCounts: EventWithCount[] = events.map((e) => ({
    id: e.id,
    name: e.name,
    event_date: e.event_date,
    location: e.location,
    people_count: countMap.get(e.id) ?? 0,
  }));

  switch (sort) {
    case "date_asc":
      return withCounts.sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
    case "name_asc":
      return withCounts.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return withCounts.sort((a, b) => b.name.localeCompare(a.name));
    case "created_desc":
      return withCounts.sort((a, b) => {
        const ea = demoDataset.eventsById.get(a.id)!.created_at;
        const eb = demoDataset.eventsById.get(b.id)!.created_at;
        return eb.localeCompare(ea);
      });
    case "people_desc":
      return withCounts.sort((a, b) => b.people_count - a.people_count);
    case "people_asc":
      return withCounts.sort((a, b) => a.people_count - b.people_count);
    default: // date_desc
      return withCounts.sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));
  }
}

export function searchEventsDemo(query: string, sort: EventSort): EventWithCount[] {
  const q = query.trim().toLowerCase();
  if (!q) return getEventsDemo(sort);

  const countMap = peopleCountByEvent();
  const seen = new Set<string>();
  const combined: typeof events = [];

  for (const e of events) if (e.name.toLowerCase().includes(q) && !seen.has(e.id)) { seen.add(e.id); combined.push(e); }
  for (const e of events) if (e.location?.toLowerCase().includes(q) && !seen.has(e.id)) { seen.add(e.id); combined.push(e); }
  for (const e of events) if (e.description?.toLowerCase().includes(q) && !seen.has(e.id)) { seen.add(e.id); combined.push(e); }

  combined.sort((a, b) => a.name.localeCompare(b.name));

  return combined.map((e) => ({
    id: e.id,
    name: e.name,
    event_date: e.event_date,
    location: e.location,
    people_count: countMap.get(e.id) ?? 0,
  }));
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export function getTagsWithCountsDemo(): TagWithCount[] {
  const countMap = new Map<string, number>();
  for (const pt of personTags) countMap.set(pt.tag_id, (countMap.get(pt.tag_id) ?? 0) + 1);

  return tags
    .map((t) => ({ id: t.id, name: t.name, color: t.color ?? "blue", count: countMap.get(t.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getPersonTagsDemo(personId: string): Tag[] {
  return personTags
    .filter((pt) => pt.person_id === personId)
    .map((pt) => demoDataset.tagsById.get(pt.tag_id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .map((t) => ({ id: t.id, name: t.name, color: t.color ?? "blue" }));
}

export function getPersonTagsMapDemo(): Map<string, Tag[]> {
  const map = new Map<string, Tag[]>();
  for (const pt of personTags) {
    const t = demoDataset.tagsById.get(pt.tag_id);
    if (!t) continue;
    const existing = map.get(pt.person_id) ?? [];
    existing.push({ id: t.id, name: t.name, color: t.color ?? "blue" });
    map.set(pt.person_id, existing);
  }
  return map;
}

// ── Follow-ups ────────────────────────────────────────────────────────────────

function withPerson(f: DemoFollowUp): FollowUpWithPerson {
  const p = demoDataset.peopleById.get(f.person_id);
  return {
    id: f.id,
    person_id: f.person_id,
    due_date: f.due_date,
    note: f.note,
    status: f.status,
    completed_at: f.completed_at,
    created_at: f.created_at,
    people: p ? { id: p.id, name: p.name } : null,
  };
}

export function getPersonFollowUpsDemo(personId: string): FollowUp[] {
  return followUps
    .filter((f) => f.person_id === personId)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .map((f) => ({
      id: f.id,
      person_id: f.person_id,
      due_date: f.due_date,
      note: f.note,
      status: f.status,
      completed_at: f.completed_at,
      created_at: f.created_at,
    }));
}

// Same shape as the person-detail page's raw query (includes updated_at).
export function getPersonFollowUpsWithUpdatedAtDemo(personId: string): (FollowUp & { updated_at: string })[] {
  return followUps
    .filter((f) => f.person_id === personId)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .map((f) => ({ ...f }));
}

export function getDoneFollowUpsDemo(limit = 50): FollowUpWithPerson[] {
  return followUps
    .filter((f) => f.status === "done")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
    .slice(0, limit)
    .map(withPerson);
}

export function getDashboardFollowUpsDemo(): DashboardFollowUps {
  const today = new Date().toISOString().split("T")[0];
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const items = followUps
    .filter((f) => f.status === "pending" || f.status === "snoozed")
    .filter((f) => f.due_date <= in14Days)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .map(withPerson);

  return {
    overdue: items.filter((f) => f.due_date < today),
    dueToday: items.filter((f) => f.due_date === today),
    upcoming: items.filter((f) => f.due_date > today),
  };
}

// ── Relationships ─────────────────────────────────────────────────────────────

export function getPersonRelationshipsDemo(personId: string): PersonRelationship[] {
  return relationships
    .filter((r) => r.person_a === personId || r.person_b === personId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => {
      const a = demoDataset.peopleById.get(r.person_a);
      const b = demoDataset.peopleById.get(r.person_b);
      return {
        id: r.id,
        type: r.type,
        created_at: r.created_at,
        person_a: r.person_a,
        person_b: r.person_b,
        a: a ? { id: a.id, name: a.name } : null,
        b: b ? { id: b.id, name: b.name } : null,
      };
    });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function getDashboardDataDemo(): DashboardData {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const companies = people.map((p) => p.company).filter((c): c is string => !!c);
  const uniqueCompaniesCount = new Set(companies.map((c) => c.toLowerCase())).size;

  const companyFreq = new Map<string, number>();
  for (const c of companies) companyFreq.set(c.toLowerCase(), (companyFreq.get(c.toLowerCase()) ?? 0) + 1);
  let mostRepresentedCompany: string | null = null;
  let maxCompanyCount = 0;
  for (const [lowerName, count] of companyFreq) {
    if (count > maxCompanyCount) {
      maxCompanyCount = count;
      mostRepresentedCompany = companies.find((c) => c.toLowerCase() === lowerName) ?? lowerName;
    }
  }

  const eventGroups = peopleCountByEvent();
  const avgPeoplePerEvent =
    eventGroups.size > 0
      ? Array.from(eventGroups.values()).reduce((a, b) => a + b, 0) / eventGroups.size
      : null;

  const tagsWithCounts = getTagsWithCountsDemo();

  const lastEvent = [...events].sort((a, b) =>
    (b.event_date ?? "").localeCompare(a.event_date ?? "") || b.created_at.localeCompare(a.created_at),
  )[0];

  const recentPeople = [...people]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, company: p.company, created_at: p.created_at }));

  return {
    stats: {
      peopleCount: people.length,
      eventsCount: events.length,
      relationshipsCount: relationships.length,
      pendingFollowUpsCount: followUps.filter((f) => f.status === "pending" || f.status === "snoozed").length,
      peopleAddedThisWeek: people.filter((p) => p.created_at >= oneWeekAgo).length,
      lastEventName: lastEvent?.name ?? null,
      relationshipsAddedThisWeek: relationships.filter((r) => r.created_at >= oneWeekAgo).length,
    },
    insights: {
      uniqueCompaniesCount,
      totalTagsCount: tagsWithCounts.length,
      completedFollowUpsCount: followUps.filter((f) => f.status === "done").length,
      mostCommonTag: tagsWithCounts[0]?.name ?? null,
      mostRepresentedCompany: maxCompanyCount > 0 ? mostRepresentedCompany : null,
      avgPeoplePerEvent,
    },
    recentPeople,
  };
}

// The "current conference" card is driven by "captured today" — meaningless
// for a static historical dataset, so Demo Mode never shows it.
export function getCurrentConferenceDemo(): ConferenceStatus | null {
  return null;
}

// ── Search ────────────────────────────────────────────────────────────────────

const GROUP_LIMIT = 6;

export function searchNetworkDemo(rawQuery: string): SearchResults {
  const q = rawQuery.trim();
  if (!q) return { people: [], companies: [], tags: [], events: [], relationships: [] };
  const qLower = q.toLowerCase();

  const peopleResults = searchPeopleDemo(q, "name_asc").map((p) => ({
    id: p.id,
    name: p.name,
    company: p.company,
    role: p.role,
  }));

  const companyFreq = new Map<string, { name: string; count: number }>();
  for (const p of people) {
    if (!p.company || !p.company.toLowerCase().includes(qLower)) continue;
    const key = p.company.toLowerCase();
    const existing = companyFreq.get(key);
    if (existing) existing.count += 1;
    else companyFreq.set(key, { name: p.company, count: 1 });
  }
  const companies = [...companyFreq.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, GROUP_LIMIT);

  const matchedTags = tags
    .filter((t) => t.name.toLowerCase().includes(qLower))
    .map((t) => ({ id: t.id, name: t.name, color: t.color ?? "blue" }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, GROUP_LIMIT);

  const matchedEvents: SearchEvent[] = events
    .filter((e) => e.name.toLowerCase().includes(qLower))
    .map((e) => ({ id: e.id, name: e.name, event_date: e.event_date }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, GROUP_LIMIT);

  const rels = relationships
    .map((r) => {
      const a = demoDataset.peopleById.get(r.person_a);
      const b = demoDataset.peopleById.get(r.person_b);
      return a && b ? { id: r.id, type: r.type, a, b } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .filter((r) => r.a.name.toLowerCase().includes(qLower) || r.b.name.toLowerCase().includes(qLower))
    .map((r) => ({ id: r.id, type: r.type, aId: r.a.id, aName: r.a.name, bId: r.b.id, bName: r.b.name }))
    .slice(0, GROUP_LIMIT);

  return {
    people: peopleResults.slice(0, GROUP_LIMIT),
    companies,
    tags: matchedTags,
    events: matchedEvents,
    relationships: rels,
  };
}

export function getSearchSuggestionsDemo(): SearchSuggestions {
  const recentEvents: SearchEvent[] = [...events]
    .sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? "") || b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map((e) => ({ id: e.id, name: e.name, event_date: e.event_date }));

  const tagsWithCounts = getTagsWithCountsDemo();

  const companyFreq = new Map<string, { name: string; count: number }>();
  for (const p of people) {
    if (!p.company) continue;
    const key = p.company.toLowerCase();
    const existing = companyFreq.get(key);
    if (existing) existing.count += 1;
    else companyFreq.set(key, { name: p.company, count: 1 });
  }
  const topCompanies = [...companyFreq.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);

  return {
    recentEvents,
    popularTags: tagsWithCounts
      .filter((t) => t.count > 0)
      .slice(0, 5)
      .map((t) => ({ id: t.id, name: t.name, color: t.color })),
    topCompanies,
  };
}

// ── Network graph ─────────────────────────────────────────────────────────────

const personId = (id: string) => `person:${id}`;
const companyId = (key: string) => `company:${key}`;
const eventId = (id: string) => `event:${id}`;
const tagId = (id: string) => `tag:${id}`;

export function getNetworkGraphDataDemo(): NetworkGraphData {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const p of people) {
    nodes.set(personId(p.id), {
      id: personId(p.id),
      kind: "person",
      label: p.name,
      degree: 0,
      navHref: `/people/${p.id}`,
      company: p.company,
      relationshipCount: 0,
      eventCount: 0,
    });
  }

  for (const p of people) {
    if (!p.company) continue;
    const key = p.company.trim().toLowerCase();
    if (!key) continue;
    const cId = companyId(key);
    if (!nodes.has(cId)) {
      nodes.set(cId, {
        id: cId,
        kind: "company",
        label: p.company.trim(),
        degree: 0,
        navHref: `/people?q=${encodeURIComponent(p.company.trim())}`,
        peopleCount: 0,
      });
    }
    edges.push({ id: `pc:${p.id}:${key}`, source: personId(p.id), target: cId, kind: "person-company" });
  }

  for (const e of events) {
    nodes.set(eventId(e.id), {
      id: eventId(e.id),
      kind: "event",
      label: e.name,
      degree: 0,
      navHref: `/events/${e.id}`,
      attendeeCount: 0,
    });
  }

  for (const t of tags) {
    nodes.set(tagId(t.id), {
      id: tagId(t.id),
      kind: "tag",
      label: t.name,
      degree: 0,
      navHref: `/people?tags=${t.id}`,
      peopleCount: 0,
    });
  }

  for (const ep of eventPeople) {
    if (!demoDataset.peopleById.has(ep.person_id) || !demoDataset.eventsById.has(ep.event_id)) continue;
    edges.push({
      id: `pe:${ep.person_id}:${ep.event_id}`,
      source: personId(ep.person_id),
      target: eventId(ep.event_id),
      kind: "person-event",
    });
  }

  for (const pt of personTags) {
    if (!demoDataset.peopleById.has(pt.person_id) || !demoDataset.tagsById.has(pt.tag_id)) continue;
    edges.push({
      id: `pt:${pt.person_id}:${pt.tag_id}`,
      source: personId(pt.person_id),
      target: tagId(pt.tag_id),
      kind: "person-tag",
    });
  }

  for (const r of relationships) {
    if (!demoDataset.peopleById.has(r.person_a) || !demoDataset.peopleById.has(r.person_b)) continue;
    edges.push({
      id: `rel:${r.id}`,
      source: personId(r.person_a),
      target: personId(r.person_b),
      kind: "relationship",
      relType: r.type,
    });
  }

  for (const edge of edges) {
    const s = nodes.get(edge.source);
    const t = nodes.get(edge.target);
    if (s) s.degree += 1;
    if (t) t.degree += 1;
    if (edge.kind === "person-company" && t) t.peopleCount = (t.peopleCount ?? 0) + 1;
    if (edge.kind === "person-tag" && t) t.peopleCount = (t.peopleCount ?? 0) + 1;
    if (edge.kind === "person-event") {
      if (t) t.attendeeCount = (t.attendeeCount ?? 0) + 1;
      if (s) s.eventCount = (s.eventCount ?? 0) + 1;
    }
    if (edge.kind === "relationship") {
      if (s) s.relationshipCount = (s.relationshipCount ?? 0) + 1;
      if (t) t.relationshipCount = (t.relationshipCount ?? 0) + 1;
    }
  }

  const nodeList = [...nodes.values()];

  const topOfKind = (kind: GraphNode["kind"]) => {
    let best: GraphNode | null = null;
    for (const n of nodeList) {
      if (n.kind !== kind) continue;
      if (!best || n.degree > best.degree) best = n;
    }
    return best && best.degree > 0 ? { name: best.label, count: best.degree } : null;
  };

  return {
    nodes: nodeList,
    edges,
    stats: {
      mostConnectedPerson: topOfKind("person"),
      mostConnectedCompany: topOfKind("company"),
      mostConnectedEvent: topOfKind("event"),
      largestCommunitySize: largestCommunity(nodeList, edges),
      totalConnections: edges.length,
    },
  };
}

function largestCommunity(nodes: GraphNode[], edges: GraphEdge[]): number {
  const parent = new Map<string, string>();
  for (const n of nodes) parent.set(n.id, n.id);

  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cur = x;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  };

  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const e of edges) if (parent.has(e.source) && parent.has(e.target)) union(e.source, e.target);

  const sizes = new Map<string, number>();
  let max = 0;
  for (const n of nodes) {
    const root = find(n.id);
    const size = (sizes.get(root) ?? 0) + 1;
    sizes.set(root, size);
    if (size > max) max = size;
  }
  return max;
}

function getDisplayLabelDemo(type: RelationshipType, isPersonA: boolean, otherName: string): string {
  switch (type) {
    case "met_together":
      return `Met together with ${otherName}`;
    case "introduced_by":
      return isPersonA ? `Introduced by ${otherName}` : `Introduced ${otherName}`;
    case "works_with":
      return `Works with ${otherName}`;
    case "co_founder":
      return `Co-founder with ${otherName}`;
    case "friend":
      return `Friends with ${otherName}`;
  }
}

export function getGraphNodeDetailDemo(nodeId: string): NodeDetail | null {
  const sep = nodeId.indexOf(":");
  if (sep === -1) return null;
  const prefix = nodeId.slice(0, sep);
  const id = nodeId.slice(sep + 1);

  if (prefix === "person") {
    const p = demoDataset.peopleById.get(id);
    if (!p) return null;

    const evts = eventPeople
      .filter((ep) => ep.person_id === id)
      .map((ep) => demoDataset.eventsById.get(ep.event_id))
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .map((e) => ({ id: e.id, name: e.name, date: e.event_date }))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

    const rels = getPersonRelationshipsDemo(id).map((r) => {
      const isPersonA = r.person_a === id;
      const other = isPersonA ? r.b : r.a;
      return {
        id: r.id,
        label: getDisplayLabelDemo(r.type as RelationshipType, isPersonA, other?.name ?? "someone"),
        otherId: other?.id ?? null,
      };
    });

    return {
      kind: "person",
      id: p.id,
      name: p.name,
      company: p.company,
      role: p.role,
      notes: p.notes,
      createdAt: p.created_at,
      tags: getPersonTagsDemo(id),
      events: evts,
      relationships: rels,
      followUps: getPersonFollowUpsDemo(id).map((f) => ({
        id: f.id,
        dueDate: f.due_date,
        note: f.note,
        status: f.status,
      })),
    };
  }

  if (prefix === "event") {
    const e = demoDataset.eventsById.get(id);
    if (!e) return null;

    const attendees = eventPeople
      .filter((ep) => ep.event_id === id)
      .map((ep) => demoDataset.peopleById.get(ep.person_id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined)
      .map((p) => ({ id: p.id, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      kind: "event",
      id: e.id,
      name: e.name,
      date: e.event_date,
      location: e.location,
      description: e.description,
      attendees,
    };
  }

  return null;
}

// ── Page-specific raw-query mirrors ──────────────────────────────────────────
// people/[id] and events/[id] query Supabase directly (not through a shared
// queries.ts helper) — these mirror those exact shapes.

export type DemoPersonRecord = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function getPersonRecordDemo(id: string): DemoPersonRecord | null {
  const p = demoDataset.peopleById.get(id);
  if (!p) return null;
  const { owner_id: _owner_id, ...rest } = p;
  return rest;
}

export type DemoEventLink = {
  created_at: string;
  encounter_note: string | null;
  events: { id: string; name: string; event_date: string | null; location: string | null } | null;
};

export function getPersonEventLinksDemo(personId: string): DemoEventLink[] {
  return eventPeople
    .filter((ep) => ep.person_id === personId)
    .map((ep) => {
      const e = demoDataset.eventsById.get(ep.event_id);
      return {
        created_at: ep.created_at,
        encounter_note: ep.encounter_note,
        events: e ? { id: e.id, name: e.name, event_date: e.event_date, location: e.location } : null,
      };
    });
}

export type DemoEventRecord = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export function getEventRecordDemo(id: string): DemoEventRecord | null {
  const e = demoDataset.eventsById.get(id);
  if (!e) return null;
  const { owner_id: _owner_id, ...rest } = e;
  return rest;
}

export type DemoPersonLink = {
  encounter_note: string | null;
  person_id: string;
  people: { id: string; name: string; company: string | null; role: string | null } | null;
};

export function getEventPersonLinksDemo(eventId: string): DemoPersonLink[] {
  return eventPeople
    .filter((ep) => ep.event_id === eventId)
    .map((ep) => {
      const p = demoDataset.peopleById.get(ep.person_id);
      return {
        encounter_note: ep.encounter_note,
        person_id: ep.person_id,
        people: p ? { id: p.id, name: p.name, company: p.company, role: p.role } : null,
      };
    });
}

// ── Export (Settings › Export must still work in Demo Mode) ─────────────────

export function getDemoExportData(): ExportData {
  return {
    profile: demoDataset.profile,
    people: demoDataset.people,
    events: demoDataset.events,
    event_people: demoDataset.eventPeople,
    tags: demoDataset.tags,
    person_tags: demoDataset.personTags,
    follow_ups: demoDataset.followUps,
    relationships: demoDataset.relationships,
  };
}
