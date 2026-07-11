# LinkedIn CSV Import — integration notes

## What this is

A bulk-import flow: the user exports `Connections.csv` from LinkedIn
(Settings → Data privacy → Get a copy of your data → Connections), uploads
it at `/people/import/linkedin`, sees a checkbox list of parsed candidates
with likely duplicates flagged, and confirms which ones to add. Confirmed
rows are inserted into `people` and tagged "LinkedIn Import" so they're
filterable later via the existing tag system.

No schema changes. No new dependencies. Reuses `linkedin_url` on `people`,
which already existed but was unused, and the existing `tags`/`person_tags`
tables.

## Files (mirror these paths into your repo)

```
src/lib/linkedin-import/types.ts       — LinkedInCandidate / ImportCandidate shapes
src/lib/linkedin-import/parseCsv.ts    — CSV parsing, LinkedIn header detection
src/lib/linkedin-import/queries.ts     — one batched query for duplicate matching
src/lib/linkedin-import/actions.ts     — importLinkedInConnections server action
src/components/linkedin-import/LinkedInImportForm.tsx
src/app/(protected)/people/import/linkedin/page.tsx
```

## Before it compiles in your repo

1. **`queries.ts`** imports `Database` from `@/types/database` — point this
   at wherever your generated Supabase types actually live.
2. **`page.tsx`** imports `DemoBlockedPage` from `@/components/DemoBlockedPage`
   — swap in the real path/name of your existing component (the one already
   used by `/people/new`, `/events/new`, etc.).
3. **Styling** is plain Tailwind utility classes (gray neutrals, blue accent,
   amber for the duplicate badge) chosen to match the palette your landing
   page already commits to. If you have shared `<Button>`/`<Badge>`-style
   components, swap those in instead of the raw `<button>`/`<span>` markup
   here — I didn't have your component library in front of me.
4. **Add an entry point.** Somewhere on `/people` (near the "New person"
   button is the obvious spot):
   ```tsx
   <Link href="/people/import/linkedin" className="text-sm text-blue-600 hover:underline">
     Import from LinkedIn
   </Link>
   ```

## Design decisions worth knowing about

- **Duplicate detection runs entirely client-side**, off one batched
  `getPeopleLiteForDuplicateCheck()` query fetched at page load — same
  "one query, match in JS" shape as `getPersonEventData()`. It checks exact
  `linkedin_url` match first, then case-insensitive full-name match. This is
  deliberately conservative (no fuzzy matching) to keep false positives low;
  it's advisory only, never blocking, same philosophy as `PersonForm`'s
  real-time duplicate panel.
- **The server action doesn't use the `(prevState, formData)` /
  `useActionState` convention** the rest of the codebase uses for forms.
  That pattern fits classic HTML inputs; this action's payload is a dynamic
  array of objects built from parsed CSV rows plus checkbox state, which
  doesn't map cleanly onto `FormData`. Instead it's called directly from the
  client inside a `useTransition` — the same mechanism `DeletePersonButton`
  already uses to call its bound server action, just with a richer return
  value than `void`.
- **Tag-then-link is two round trips total** (find-or-create the "LinkedIn
  Import" tag once, then one bulk insert into `person_tags`), not one per
  person — consistent with the batching philosophy elsewhere in the app.
- **Sequential-not-atomic**, intentionally: if the tag insert fails after
  people are already created, the import still reports success with the
  people added and just skips tagging, rather than rolling back. Same
  tradeoff `captureAndSave` already makes for capture-speed over strict
  atomicity.

## Known limitations / good next passes if this gets real usage

- No virtualization — a very large export (LinkedIn caps around a few
  thousand connections) renders every filtered row in the DOM. If that
  becomes a real problem, `ProgressiveList` already exists in the codebase
  for exactly this.
- No undo, unlike Capture Mode's "Captured today + undo". Worth adding for
  symmetry if this import flow gets used often — importing 50 people and
  regretting 3 of them currently means deleting them one by one.
- Duplicate matching is exact-match only. A near-miss like "Bob Smith" vs
  "Robert Smith" won't be flagged. Fine for a first pass; revisit if it
  turns out to matter in practice.
