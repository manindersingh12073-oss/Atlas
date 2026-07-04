// ── Types ─────────────────────────────────────────────────────────────────────

export type RestoreSummary = {
  people: number;
  events: number;
  event_people: number;
  tags: number;
  person_tags: number;
  follow_ups: number;
  relationships: number;
  exportedAt: string;
  sourceEmail: string;
};

export type ValidationResult =
  | { valid: true; summary: RestoreSummary }
  | { valid: false; errors: string[] };

// ── Constants ─────────────────────────────────────────────────────────────────

const SUPPORTED_SCHEMA_VERSION = "1";

const VALID_FOLLOW_UP_STATUSES = new Set(["pending", "done", "snoozed"]);
const VALID_RELATIONSHIP_TYPES = new Set([
  "met_together",
  "introduced_by",
  "works_with",
  "co_founder",
  "friend",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ── Row validators ────────────────────────────────────────────────────────────

type RowError = { entity: string; count: number; sample: string };

function checkPeople(rows: unknown[]): RowError | null {
  let bad = 0;
  for (const r of rows) {
    if (!isObject(r) || !isUUID(r.id) || !isNonEmptyString(r.name)) bad++;
  }
  return bad > 0
    ? { entity: "people", count: bad, sample: "required: id (UUID), name (string)" }
    : null;
}

function checkEvents(rows: unknown[]): RowError | null {
  let bad = 0;
  for (const r of rows) {
    if (!isObject(r) || !isUUID(r.id) || !isNonEmptyString(r.name)) bad++;
  }
  return bad > 0
    ? { entity: "events", count: bad, sample: "required: id (UUID), name (string)" }
    : null;
}

function checkTags(rows: unknown[]): RowError | null {
  let bad = 0;
  for (const r of rows) {
    if (!isObject(r) || !isUUID(r.id) || !isNonEmptyString(r.name)) bad++;
  }
  return bad > 0
    ? { entity: "tags", count: bad, sample: "required: id (UUID), name (string)" }
    : null;
}

function checkFollowUps(rows: unknown[]): RowError | null {
  let bad = 0;
  for (const r of rows) {
    if (
      !isObject(r) ||
      !isUUID(r.id) ||
      !isUUID(r.person_id) ||
      !isNonEmptyString(r.due_date) ||
      !VALID_FOLLOW_UP_STATUSES.has(r.status as string)
    )
      bad++;
  }
  return bad > 0
    ? {
        entity: "follow_ups",
        count: bad,
        sample: "required: id, person_id (UUID), due_date, status (pending|done|snoozed)",
      }
    : null;
}

function checkEventPeople(rows: unknown[]): RowError | null {
  let bad = 0;
  for (const r of rows) {
    if (!isObject(r) || !isUUID(r.event_id) || !isUUID(r.person_id)) bad++;
  }
  return bad > 0
    ? { entity: "event_people", count: bad, sample: "required: event_id, person_id (UUID)" }
    : null;
}

function checkPersonTags(rows: unknown[]): RowError | null {
  let bad = 0;
  for (const r of rows) {
    if (!isObject(r) || !isUUID(r.person_id) || !isUUID(r.tag_id)) bad++;
  }
  return bad > 0
    ? { entity: "person_tags", count: bad, sample: "required: person_id, tag_id (UUID)" }
    : null;
}

function checkRelationships(rows: unknown[]): RowError | null {
  let bad = 0;
  for (const r of rows) {
    if (
      !isObject(r) ||
      !isUUID(r.id) ||
      !isUUID(r.person_a) ||
      !isUUID(r.person_b) ||
      !VALID_RELATIONSHIP_TYPES.has(r.type as string) ||
      r.person_a === r.person_b
    )
      bad++;
  }
  return bad > 0
    ? {
        entity: "relationships",
        count: bad,
        sample: "required: id, person_a, person_b (UUID, distinct), type (valid enum)",
      }
    : null;
}

// ── Main validator ────────────────────────────────────────────────────────────

export function validateBackup(data: unknown): ValidationResult {
  const errors: string[] = [];

  // Level 1 — top-level structure
  if (!isObject(data)) {
    return { valid: false, errors: ["The file is not a valid Atlas backup object."] };
  }

  if (!isObject(data.meta)) {
    errors.push('Missing or invalid "meta" object.');
  } else {
    // Level 2 — schema version (hard rejection for any version other than "1")
    if (data.meta.schema_version !== SUPPORTED_SCHEMA_VERSION) {
      return {
        valid: false,
        errors: [
          `Unsupported schema_version: "${data.meta.schema_version}". ` +
            `This version of Atlas only supports schema_version "${SUPPORTED_SCHEMA_VERSION}". ` +
            (String(data.meta.schema_version) > SUPPORTED_SCHEMA_VERSION
              ? "Please update Atlas before restoring."
              : "This backup format is too old to restore."),
        ],
      };
    }

    if (data.meta.export_type !== "full_backup") {
      errors.push(
        `Unsupported export_type: "${data.meta.export_type}". Only "full_backup" can be restored.`,
      );
    }
  }

  // Level 3 — required arrays
  const required = [
    "people",
    "events",
    "event_people",
    "tags",
    "person_tags",
    "follow_ups",
    "relationships",
  ] as const;

  for (const key of required) {
    if (!isArray(data[key])) {
      errors.push(`Missing or invalid "${key}" array.`);
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  // From here the arrays are confirmed to be arrays.
  const people = data.people as unknown[];
  const events = data.events as unknown[];
  const eventPeople = data.event_people as unknown[];
  const tags = data.tags as unknown[];
  const personTags = data.person_tags as unknown[];
  const followUps = data.follow_ups as unknown[];
  const relationships = data.relationships as unknown[];

  // Level 4 — required fields per entity
  const rowErrors = [
    checkPeople(people),
    checkEvents(events),
    checkTags(tags),
    checkFollowUps(followUps),
    checkEventPeople(eventPeople),
    checkPersonTags(personTags),
    checkRelationships(relationships),
  ].filter((e): e is RowError => e !== null);

  for (const e of rowErrors) {
    errors.push(`${e.count} invalid row(s) in "${e.entity}" (${e.sample}).`);
  }

  if (errors.length > 0) return { valid: false, errors };

  // Level 5 — intra-backup uniqueness (check for duplicate PKs)
  function dupeCheck(rows: unknown[], keyFn: (r: unknown) => string, label: string) {
    const seen = new Set<string>();
    let dupes = 0;
    for (const r of rows) {
      const k = keyFn(r);
      if (seen.has(k)) dupes++;
      else seen.add(k);
    }
    if (dupes > 0) errors.push(`${dupes} duplicate key(s) found in "${label}".`);
  }

  dupeCheck(people, (r) => (r as Record<string, unknown>).id as string, "people");
  dupeCheck(events, (r) => (r as Record<string, unknown>).id as string, "events");
  dupeCheck(tags, (r) => (r as Record<string, unknown>).id as string, "tags");
  dupeCheck(followUps, (r) => (r as Record<string, unknown>).id as string, "follow_ups");
  dupeCheck(relationships, (r) => (r as Record<string, unknown>).id as string, "relationships");
  dupeCheck(
    eventPeople,
    (r) => {
      const row = r as Record<string, unknown>;
      return `${row.event_id}:${row.person_id}`;
    },
    "event_people",
  );
  dupeCheck(
    personTags,
    (r) => {
      const row = r as Record<string, unknown>;
      return `${row.person_id}:${row.tag_id}`;
    },
    "person_tags",
  );

  // Level 6 — intra-backup referential integrity
  const peopleIds = new Set(people.map((r) => (r as Record<string, unknown>).id as string));
  const eventIds = new Set(events.map((r) => (r as Record<string, unknown>).id as string));
  const tagIds = new Set(tags.map((r) => (r as Record<string, unknown>).id as string));

  let badFollowUpRefs = 0;
  for (const r of followUps) {
    if (!peopleIds.has((r as Record<string, unknown>).person_id as string)) badFollowUpRefs++;
  }
  if (badFollowUpRefs > 0)
    errors.push(`${badFollowUpRefs} follow_ups reference people not found in this backup.`);

  let badEpPersonRefs = 0;
  let badEpEventRefs = 0;
  for (const r of eventPeople) {
    const row = r as Record<string, unknown>;
    if (!peopleIds.has(row.person_id as string)) badEpPersonRefs++;
    if (!eventIds.has(row.event_id as string)) badEpEventRefs++;
  }
  if (badEpPersonRefs > 0)
    errors.push(`${badEpPersonRefs} event_people reference people not found in this backup.`);
  if (badEpEventRefs > 0)
    errors.push(`${badEpEventRefs} event_people reference events not found in this backup.`);

  let badPtPersonRefs = 0;
  let badPtTagRefs = 0;
  for (const r of personTags) {
    const row = r as Record<string, unknown>;
    if (!peopleIds.has(row.person_id as string)) badPtPersonRefs++;
    if (!tagIds.has(row.tag_id as string)) badPtTagRefs++;
  }
  if (badPtPersonRefs > 0)
    errors.push(`${badPtPersonRefs} person_tags reference people not found in this backup.`);
  if (badPtTagRefs > 0)
    errors.push(`${badPtTagRefs} person_tags reference tags not found in this backup.`);

  let badRelRefs = 0;
  for (const r of relationships) {
    const row = r as Record<string, unknown>;
    if (!peopleIds.has(row.person_a as string) || !peopleIds.has(row.person_b as string))
      badRelRefs++;
  }
  if (badRelRefs > 0)
    errors.push(`${badRelRefs} relationships reference people not found in this backup.`);

  if (errors.length > 0) return { valid: false, errors };

  const meta = data.meta as Record<string, unknown>;

  return {
    valid: true,
    summary: {
      people: people.length,
      events: events.length,
      event_people: eventPeople.length,
      tags: tags.length,
      person_tags: personTags.length,
      follow_ups: followUps.length,
      relationships: relationships.length,
      exportedAt: (meta.exported_at as string) ?? "",
      sourceEmail: (meta.email as string) ?? "",
    },
  };
}
