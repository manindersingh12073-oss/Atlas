import { zipSync } from "fflate";

import type { ExportData } from "@/lib/export/queries";

export const ATLAS_VERSION = "2.0";
export const SCHEMA_VERSION = "1";

// ── CSV ───────────────────────────────────────────────────────────────────────

// Column lists for each CSV. owner_id is intentionally excluded — it is the
// same UUID for every row and adds noise for human readers. It IS included in
// atlas-export.json (see buildJSON) to simplify future import logic.

const CSV_COLUMNS: Record<string, string[]> = {
  people: [
    "id", "name", "company", "role", "linkedin_url",
    "email", "phone", "notes", "created_at", "updated_at",
  ],
  events: [
    "id", "name", "event_date", "location", "description",
    "created_at", "updated_at",
  ],
  event_people: ["event_id", "person_id", "encounter_note", "created_at"],
  relationships: ["id", "person_a", "person_b", "type", "created_at"],
  followups: [
    "id", "person_id", "due_date", "note", "status",
    "completed_at", "created_at", "updated_at",
  ],
  tags: ["id", "name", "color", "created_at"],
  person_tags: ["person_id", "tag_id"],
};

function escapeField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // RFC 4180: enclose in double-quotes if the field contains a comma, double-quote,
  // or line break. Escape internal double-quotes by doubling them.
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const dataRows = rows.map((row) =>
    columns.map((col) => escapeField(row[col])).join(","),
  );
  return [header, ...dataRows].join("\n");
}

// ── JSON ──────────────────────────────────────────────────────────────────────

export function buildJSON(data: ExportData, email: string): string {
  const exportedAt = new Date().toISOString();

  const output = {
    meta: {
      schema_version: SCHEMA_VERSION,
      atlas_version: ATLAS_VERSION,
      export_type: "full_backup",
      exported_at: exportedAt,
      email,
    },
    profile: data.profile,
    // owner_id is preserved in all entity arrays to simplify future import logic:
    // the importer maps the backup's owner_id values to the importing user's UID.
    people: data.people,
    events: data.events,
    event_people: data.event_people,
    tags: data.tags,
    person_tags: data.person_tags,
    follow_ups: data.follow_ups,
    relationships: data.relationships,
  };

  return JSON.stringify(output, null, 2);
}

// ── Manifest ──────────────────────────────────────────────────────────────────

function buildManifest(data: ExportData, exportedAt: string): string {
  return JSON.stringify(
    {
      atlas_version: ATLAS_VERSION,
      schema_version: SCHEMA_VERSION,
      exported_at: exportedAt,
      tables: {
        people: data.people.length,
        events: data.events.length,
        event_people: data.event_people.length,
        tags: data.tags.length,
        person_tags: data.person_tags.length,
        follow_ups: data.follow_ups.length,
        relationships: data.relationships.length,
      },
    },
    null,
    2,
  );
}

// ── README ────────────────────────────────────────────────────────────────────

function buildREADME(email: string, exportedAt: string): string {
  const date = exportedAt.split("T")[0];

  return `Atlas Data Export
Generated: ${date}
User: ${email}
Atlas version: ${ATLAS_VERSION}
Schema version: ${SCHEMA_VERSION}

FILES
─────

manifest.json
  Machine-readable index of this ZIP. Contains table row counts and version
  metadata. Useful for validating completeness before parsing the full backup.

atlas-export.json
  Complete backup of all Atlas data in a single JSON file, including owner_id
  on every row. Use this file to re-import into Atlas (feature coming soon).

people.csv
  Your contacts. Each row is one person.
  Columns: id, name, company, role, linkedin_url, email, phone, notes,
           created_at, updated_at

events.csv
  Events you have attended or recorded.
  Columns: id, name, event_date, location, description, created_at, updated_at

event_people.csv
  Links between people and events.
  event_id refers to a row in events.csv.
  person_id refers to a row in people.csv.
  encounter_note is an optional note about that specific meeting.
  Columns: event_id, person_id, encounter_note, created_at

relationships.csv
  Person-to-person relationships.
  Both person_a and person_b refer to rows in people.csv.

  Relationship types:
    met_together   Symmetric. person_a and person_b met together with you.
    introduced_by  Asymmetric. person_a was introduced by person_b.
                   Example: (person_a=Sarah, person_b=Ali, type=introduced_by)
                   → Sarah's page reads "Introduced by Ali"
                   → Ali's page reads "Introduced Sarah"
                   When person_a and person_b are swapped, the meaning inverts.
                   All other types are symmetric: swapping the two persons does
                   not change the meaning.
    works_with     Symmetric. person_a and person_b work together.
    co_founder     Symmetric. person_a and person_b co-founded something.
    friend         Symmetric. person_a and person_b are friends.

  Columns: id, person_a, person_b, type, created_at

followups.csv
  Follow-up reminders attached to people.
  person_id refers to a row in people.csv.
  Status values: pending | done | snoozed
  Columns: id, person_id, due_date, note, status, completed_at,
           created_at, updated_at

tags.csv
  Labels you have created.
  Columns: id, name, color, created_at

person_tags.csv
  Which tags are attached to which people.
  person_id refers to people.csv; tag_id refers to tags.csv.
  Columns: person_id, tag_id

TIMESTAMPS
──────────
All created_at / updated_at values are UTC in ISO 8601 format:
  e.g. 2026-06-26T10:00:00.000Z

event_date and due_date are date-only values (YYYY-MM-DD) with no time component.

FOREIGN KEYS
────────────
UUIDs are preserved exactly as stored in Atlas. Relationships between files:
  event_people.event_id  → events.id
  event_people.person_id → people.id
  person_tags.person_id  → people.id
  person_tags.tag_id     → tags.id
  follow_ups.person_id   → people.id
  relationships.person_a → people.id
  relationships.person_b → people.id

IMPORT
──────
To restore this backup into Atlas, use atlas-export.json with Atlas's import
feature (coming soon). The JSON preserves all original UUIDs and owner_id
values to allow lossless round-tripping.
`;
}

// ── ZIP ───────────────────────────────────────────────────────────────────────

export function buildZip(data: ExportData, email: string): Uint8Array {
  const exportedAt = new Date().toISOString();
  const encode = (s: string) => new TextEncoder().encode(s);

  const jsonContent = buildJSON(data, email);
  const manifestContent = buildManifest(data, exportedAt);
  const readmeContent = buildREADME(email, exportedAt);

  return zipSync({
    "manifest.json": encode(manifestContent),
    "README.txt": encode(readmeContent),
    "atlas-export.json": encode(jsonContent),
    "people.csv": encode(buildCSV(data.people, CSV_COLUMNS.people)),
    "events.csv": encode(buildCSV(data.events, CSV_COLUMNS.events)),
    "event_people.csv": encode(
      buildCSV(data.event_people, CSV_COLUMNS.event_people),
    ),
    "relationships.csv": encode(
      buildCSV(data.relationships, CSV_COLUMNS.relationships),
    ),
    "followups.csv": encode(buildCSV(data.follow_ups, CSV_COLUMNS.followups)),
    "tags.csv": encode(buildCSV(data.tags, CSV_COLUMNS.tags)),
    "person_tags.csv": encode(
      buildCSV(data.person_tags, CSV_COLUMNS.person_tags),
    ),
  });
}

// Re-export buildJSON with the exportedAt included for the standalone JSON route.
// The ZIP route uses buildZip which calls buildJSON internally.
export { buildCSV };
