# Task: Build the LinkedIn CSV import feature

## Before you start

Read `ARCHITECTURE.md`, `PROJECT_CONTEXT.md`, `ROADMAP.md`, and
`PRODUCT_PRINCIPLES.md` first, per this repo's own AI development
instructions. Reuse existing patterns wherever possible — this feature is
designed to fit the current architecture exactly, not introduce new ones.

## What this feature is

A bulk-import flow for `/people`. The user exports `Connections.csv` from
LinkedIn (Settings → Data privacy → Get a copy of your data → Connections),
uploads it, sees a checkbox list of parsed candidates with likely duplicates
flagged in an amber advisory badge (same visual language as `PersonForm`'s
existing duplicate-detection panel), and confirms which ones to add.
Confirmed rows are inserted into `people` and tagged "LinkedIn Import" so
they're filterable later via the existing tag system.

**No schema changes.** This uses the `linkedin_url` column on `people`,
which already exists but has never been populated by any current flow, plus
the existing `tags`/`person_tags` tables. **No new dependencies** — CSV
parsing is hand-rolled (LinkedIn's export format is simple enough that
adding a library isn't justified).

## Reference implementation

A working draft already exists at `/atlas-linkedin-import/`
(also pasted in full below) covering:

- `src/lib/linkedin-import/types.ts` — `LinkedInCandidate` (raw parsed row
  shape) and `ImportCandidate` (adds `id`/`isDuplicate`/`selected` for the
  review UI)
- `src/lib/linkedin-import/parseCsv.ts` — CSV line parsing (handles quoted
  fields and embedded commas) plus LinkedIn-specific header detection: the
  export has a variable-length "Notes:" preamble before the real header row,
  so this scans for the row containing both "First Name" and "Last Name"
  rather than skipping a fixed number of lines
- `src/lib/linkedin-import/queries.ts` — `getPeopleLiteForDuplicateCheck()`,
  one batched query (id, name, company, linkedin_url) for all of the current
  user's people, used for client-side duplicate matching — same "one query,
  match in JS" shape as the existing `getPersonEventData()`
- `src/lib/linkedin-import/actions.ts` — `importLinkedInConnections()`: bulk
  inserts into `people` with `owner_id` set server-side, then find-or-creates
  a "LinkedIn Import" tag and bulk-inserts into `person_tags` (two round
  trips total, not one per person)
- `src/components/linkedin-import/LinkedInImportForm.tsx` — client
  component: file input → parse on load → filterable checkbox list with
  select-all/deselect-all → confirm button → result message
- `src/app/(protected)/people/import/linkedin/page.tsx` — the route, gated by
  `isDemoMode()` like every other write route in `(protected)`

Treat this as a strong starting point, not a final answer — adapt it to
match this repo exactly (see "Fix before merging" below).

## Fix before merging

1. **`queries.ts`** imports `Database` from `@/types/database` as a
   placeholder — point it at wherever this repo's generated Supabase types
   actually live.
2. **`page.tsx`** imports `DemoBlockedPage` from `@/components/DemoBlockedPage`
   as a placeholder — use the real import path/name, matching how
   `/people/new` or `/events/new` already do it.
3. **Styling** in `LinkedInImportForm.tsx` is plain Tailwind utility classes
   guessed to match the landing page's stated palette (gray neutrals, single
   blue accent, no purple). Replace with this repo's actual shared
   components if equivalents exist — check for an existing `Button`,
   `Badge`, or the specific classes `PersonForm`'s duplicate-advisory panel
   uses, and match that instead of inventing new markup.
4. **Tag race condition**: the find-or-create logic in `actions.ts` does a
   select-then-insert for the "LinkedIn Import" tag, which has a small race
   window if a user somehow triggers two imports at once. `tags` has a
   unique index on `(owner_id, lower(name))` per `ARCHITECTURE.md` — check
   whether an `.upsert()` with `onConflict` targeting that index is cleaner
   than the current select-then-insert-then-catch approach, and use whichever
   fits this repo's existing conventions for similar find-or-create logic
   (e.g. how `createAndAddTag` in `src/lib/tags/actions.ts` already handles
   this, if it does).
5. **Entry point**: add a link on `/people` near the "New person" action —
   `<Link href="/people/import/linkedin">Import from LinkedIn</Link>` styled
   to match whatever that button already looks like.

## Design decisions to preserve (don't "fix" these)

- **Duplicate detection is client-side and exact-match only** (linkedin_url
  equality first, then case-insensitive full-name equality) — deliberately
  conservative, advisory only, never blocks the import. Don't add fuzzy
  matching unless asked; it's a good v2, not a v1 requirement.
- **The server action does not use the `(prevState, formData)` /
  `useActionState` convention** used elsewhere for forms — it's called
  directly from the client inside a `useTransition`, the same mechanism
  `DeletePersonButton` uses for its bound server action. The payload is a
  dynamic array of objects from parsed CSV rows plus checkbox state, which
  doesn't map cleanly onto `FormData`. Keep this pattern; don't force it back
  into `useActionState`.
- **Sequential, not atomic**: if the tag insert fails after people are
  already created, report partial success (people added, tagging skipped)
  rather than rolling back — same tradeoff `captureAndSave` already makes.

## Acceptance checklist

- [ ] `npm run typecheck` / `tsc --noEmit` passes
- [ ] Lint passes
- [ ] Visiting `/people/import/linkedin` while `isDemoMode()` is true renders
      `DemoBlockedPage`, not the real form
- [ ] Uploading a real (or the sample below) LinkedIn CSV export parses
      correctly despite the "Notes:" preamble
- [ ] A connection whose name exactly matches an existing person is
      pre-unchecked and shows the "Possible duplicate" badge, but can still
      be checked and imported
- [ ] Confirming an import creates the selected people with `owner_id` set
      server-side, `linkedin_url` populated, and all of them tagged
      "LinkedIn Import"
- [ ] Running the import twice does not create a second "LinkedIn Import"
      tag (tag is found, not duplicated)
- [ ] The People page filter-by-tag can find the imported batch via the
      "LinkedIn Import" tag
- [ ] A link to `/people/import/linkedin` exists somewhere reachable from
      `/people`

## Sample CSV for manual testing

```csv
Notes:
"When exporting your connection data, you will only get data for connections made after March 2019. Please review LinkedIn's help section for further explanation on data exports."


First Name,Last Name,URL,Email Address,Company,Position,Connected On
Priya,Shah,https://www.linkedin.com/in/priyashah,,Acme Corp,VP Product,15 Jun 2026
"Smith, Jr.",Robert,https://www.linkedin.com/in/rsmithjr,rob@example.com,Globex,Engineer,02 Jan 2026
Jane,Doe,,,,,10 Mar 2025
```

(Note the third row has no name in the expected columns after parsing edge
cases — use it to confirm the skipped-row count logic works, and the second
row to confirm quoted-comma handling in a name field works.)

---

## Full reference source

<!-- Paste the full contents of the six files from
/mnt/user-data/outputs/atlas-linkedin-import/ here before sending this
prompt, or point Claude Code directly at that folder if it's accessible
from the working directory. -->
