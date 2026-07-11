# Atlas Architecture

---

## Next.js Structure

- **Framework:** Next.js 16, App Router, TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first, `@theme` in `globals.css`, no `tailwind.config.js`)
- **Entry point:** `src/proxy.ts` — Next.js 16 proxy (replaces `middleware.ts`); runs on every non-static request to refresh the Supabase session
- **Path alias:** `@/*` → `src/*`

```
src/
  app/
    (auth)/          # Public auth pages — no URL segment
    (protected)/     # Authenticated pages — no URL segment
    auth/            # OAuth callback route and error page
    layout.tsx       # Root layout
    page.tsx         # Public landing
    globals.css      # Tailwind entry + theme tokens
  components/        # Shared UI components
  lib/               # Server-side logic (actions, queries, Supabase clients)
  types/             # Generated DB types and entity aliases
  proxy.ts           # Session refresh on every request
```

---

## Route Groups

### `(auth)` — public
- `layout.tsx` — centers content
- `login/page.tsx` — Google sign-in button; bounces authed users to `/dashboard`

### `(protected)` — authenticated
- `layout.tsx` — **authoritative auth guard**; calls `getUser()` server-side, or a valid `atlas_demo` cookie (Demo Mode); redirects to `/login` if neither; mounts `CommandPalette`, `DemoModeModal`
- All app pages live here; full route tree:

```
/dashboard
/insights                                    # network graph + analytics
/settings                                    # appearance, Ask Atlas goals, data export/restore, about
/capture                                     # conference/quick-capture mode
/people
/people/new
/people/[id]
/people/[id]/edit
/people/[id]/link-event                      # select an existing event to link
/people/[id]/add-event                       # create a new event and link atomically
/people/[id]/follow-ups/new
/people/[id]/follow-ups/[followUpId]/edit
/events
/events/new
/events/[id]
/events/[id]/edit
/events/[id]/capture                         # capture mode pre-scoped to this event
/events/[id]/link-person                     # select an existing person to link
/events/[id]/add-person                      # create a new person and link atomically
/events/[id]/people/[personId]/edit-note     # edit encounter note for a specific link
```

Routes that are entirely about writing (all `new`/`edit`/`link-*`/`add-*`/capture routes above) render `<DemoBlockedPage>` instead of the real form when `isDemoMode()` is true.

### `auth/` — OAuth plumbing
- `callback/route.ts` — exchanges `?code=` for a session; redirects to `/dashboard`; also clears any stale `atlas_demo` cookie on successful sign-in
- `auth-code-error/page.tsx` — fallback for failed exchanges

### `demo/` — Demo Mode entry/exit
- `route.ts` — sets the `atlas_demo` cookie (30-day expiry) and redirects to `/dashboard`
- `exit/route.ts` — clears the cookie and redirects (`?next=` or `/login`)

### `api/` — Route Handlers
- `assistant/chat` — Ask Atlas streaming endpoint (Node runtime, authenticated or demo)
- `search`, `search/suggestions` — Universal Search backend
- `graph/node` — lazy node-detail fetch for the Network Graph
- `export/json`, `export/zip` — full-account data export
- `restore/validate`, `restore/execute` — backup validation and destructive restore

---

## Authentication Flow

1. User clicks "Continue with Google" → `signInWithGoogle()` server action → `supabase.auth.signInWithOAuth()` → redirect to Google
2. Google redirects to `/auth/callback?code=...`
3. Callback route calls `exchangeCodeForSession(code)` → sets session cookies → redirects to `/dashboard`
4. `src/proxy.ts` calls `updateSession()` on every request, which calls `getUser()` to refresh tokens and write updated cookies
5. `(protected)/layout.tsx` re-validates the session server-side on every protected page render (defence in depth)
6. `signOut()` server action calls `supabase.auth.signOut()` → redirect to `/login`

**Redirect rules** (in `src/lib/supabase/middleware.ts`):
- Unauthenticated + non-public path → `/login`
- Authenticated + `/login` → `/dashboard`
- Public paths: `/`, `/login`, `/auth/*`

---

## Supabase Setup

Three client variants, all in `src/lib/supabase/`:

| File | Used in | Notes |
|---|---|---|
| `server.ts` | Server Components, Server Actions, Route Handlers | `createServerClient`; reads/writes cookies via `next/headers`; create fresh per request |
| `client.ts` | Client Components | `createBrowserClient`; reads session from cookies |
| `middleware.ts` | `proxy.ts` only | `createServerClient` with request/response cookie wrappers; calls `getUser()` to trigger token refresh |

All clients are parameterised with the generated `Database` type for typed queries.

Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` — safe to expose; used by both clients
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to expose; RLS enforces security
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; bypasses RLS; not yet used in application code
- `NEXT_PUBLIC_SITE_URL` — used to construct OAuth redirect URLs

Validated centrally in `src/lib/env.ts`; fails loudly at startup if missing.

---

## RLS Approach

Every table has `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`. Four policies per table (SELECT / INSERT / UPDATE / DELETE).

- **Primary tables** (`people`, `events`, `tags`, `follow_ups`): `owner_id = auth.uid()`
- **Junction tables** (`event_people`, `person_tags`): `owner_id` is denormalized onto the junction row; same `owner_id = auth.uid()` policy — no JOINs in policies
- **`profiles`**: `id = auth.uid()`
- UPDATE policies carry both `USING` and `WITH CHECK` to prevent ownership reassignment

Application code always sets `owner_id` server-side from `getUser()`. It is never accepted from client input.

---

## Database Tables

| Table | PK | Key columns | Notes |
|---|---|---|---|
| `profiles` | `id` (= `auth.users.id`) | `full_name`, `avatar_url` | Auto-created by trigger on `auth.users` INSERT |
| `people` | `uuid` | `name` (required), `company`, `role`, `linkedin_url`, `email`, `phone`, `notes`, `search_vector` | `search_vector` is a generated tsvector over name+company+role+notes |
| `events` | `uuid` | `name` (required), `event_date`, `location`, `description` | |
| `event_people` | `(event_id, person_id)` | `encounter_note`, `owner_id` | Junction; owner_id denormalized |
| `tags` | `uuid` | `name`, `color` | Unique on `(owner_id, lower(name))` |
| `person_tags` | `(person_id, tag_id)` | `owner_id` | Junction; owner_id denormalized |
| `follow_ups` | `uuid` | `person_id`, `due_date`, `note`, `status`, `completed_at` | Status: `pending` / `done` / `snoozed` |
| `person_relationships` | `uuid` | `person_a`, `person_b`, `type`, `owner_id` | Type enum: `met_together` / `introduced_by` / `works_with` / `co_founder` / `friend`; unique dedup index on the pair |
| `atlas_memory` | `uuid` | `category`, `content`, `owner_id` | Category: `goal` / `preference` / `note`; backs Ask Atlas's user-editable networking goals (Settings) |

**Key indexes:** GIN on `people.search_vector`; GIN trigram on `people.name`; `(owner_id, event_date DESC NULLS LAST)` on events; `(owner_id, status, due_date)` on follow_ups.

**Migrations** (`supabase/migrations/`, 8 files):
`20260615000001_extensions.sql` · `20260615000002_profiles.sql` · `20260615000003_people_events_tags.sql` · `20260615000004_junctions_follow_ups.sql` · `20260615000005_indexes.sql` · `20260616000001_rpc_create_and_link.sql` · `20260621000002_person_relationships.sql` · `20260707000001_atlas_memory.sql`

**Postgres RPCs** (migration `20260616000001`):
- `create_person_and_link(p_event_id, p_name, ...)` — atomically inserts a person and an `event_people` row
- `create_event_and_link(p_person_id, p_name, ...)` — atomically inserts an event and an `event_people` row
- Both use `SECURITY INVOKER`; RLS applies normally inside

**Known gap:** `person_relationships` was added after the last `npm run db:types` run, so it isn't in the generated `Database` type. `src/lib/relationships/actions.ts` and `src/lib/capture/actions.ts` cast `supabase as any` for inserts against this table as a documented workaround — re-running `db:types` removes the need for the cast.

---

## Search Architecture

Atlas has one search engine (`searchNetwork()` in `src/lib/search/queries.ts`) powering the dashboard bar, People page, and Command Palette, plus a People-specific ranked search. Full detail — the 6-query ranked People search, the `searchNetwork()`/Command Palette/`UniversalSearchBar` layering, recent-viewed people, and Events search — lives in **`PROJECT_CONTEXT.md` → "Search Functionality"**; this section only summarises to avoid duplicated, driftable detail.

### People (`/people?q=`) — `searchPeople()` in `src/lib/people/queries.ts`

Empty query returns all people with the current sort applied. Query strings are pre-escaped (`%` → `\%`, `_` → `\_`) before being used in ILIKE patterns. Round 1 (parallel): FTS on `search_vector`, `ilike` name, `ilike` company, tag-name match (`person_tags` join), event-name match (`event_people` join). Round 2 (conditional): `person_relationships` lookup when Round 1 name matches exist. Results are ranked by strongest signal matched, then merged/deduped by `id`.

### Events (`/events?q=`)

Four parallel queries, merged and deduplicated by `id`, sorted alphabetically by name:

1. `.ilike("name", "%q%")` — name results merged first; appears before location/description matches
2. `.ilike("location", "%q%")`
3. `.ilike("description", "%q%")`
4. `event_people` count query — attached to results as `people_count`

Empty query delegates to `getEvents()`.

Implemented in `src/lib/events/queries.ts → searchEvents()`.

### Other query helpers in `src/lib/people/queries.ts`

**`getPersonEventData(supabase)`** — returns a `Map<person_id, { event_count, recent_events[] }>`. One query for all `event_people` rows; groups and sorts in JS. Used by the people list page to show per-person event counts and up to 2 recent event previews without N+1 queries.

**`getCompanySuggestions(supabase)`** — returns distinct company names from the authenticated user's people, deduplicated case-insensitively with the most-frequent casing preserved. Feeds the `<datalist>` in `PersonForm`.

### `getEvents()` in `src/lib/events/queries.ts`

Two parallel queries (events + event_people) merged in JS. "Most people" / "Fewest people" sorts are applied client-side after joining the count. All other sorts are applied at the DB level.

### Search Input Component

`src/components/SearchInput.tsx` — generic Client Component used by both pages.

- Debounced 300ms via `useRef` timer
- `router.replace()` inside `useTransition` (shows `opacity-60` pending state)
- Accepts `pathname`, `currentSort`, `defaultSort` as props to preserve the sort param in the URL without needing `useSearchParams`
- No Suspense boundary required
- Wrapped in a `<form method="GET">` on each page for Enter-key fallback

`PeopleSearchInput` is a thin wrapper that binds people-specific props.

---

## Sorting Architecture

URL param: `?sort=value`. Parsed and validated by `parsePeopleSort()` / `parseEventSort()` on the server; unknown values fall back to the default.

Sort is applied at the DB level for all options except "Most Events" (people) and "Most People" / "Fewest People" (events), which require a count join and are applied in JS after merging.

During active search (`?q=` is set), sort is ignored for results (always alphabetical) and the `SortSelect` is disabled.

`src/components/SortSelect.tsx` — Client Component. Uses `usePathname()` + `useSearchParams()` to update only `?sort=` while preserving all other params. Must be wrapped in `<Suspense>` at each render site.

---

## Duplicate Detection Architecture

Real-time, advisory, non-blocking. Lives entirely in `PersonForm` (Client Component).

- On name field `onChange`: debounce 300ms → if ≥ 3 chars → browser Supabase client queries `.ilike("name", "%typed%").limit(5)`
- RLS automatically scopes the query to the authenticated user's people
- Results render in an amber advisory panel below the name field with "View →" links (open in new tab)
- Suggestions clear when name is < 3 chars or emptied
- `excludeId` prop prevents the edit page from flagging the person being edited as their own duplicate
- Form submission is never blocked; the user can ignore all suggestions

---

## Shared Component Patterns

### Forms
- **`PersonForm`** — Client Component; `useActionState`; uncontrolled inputs with `defaultValue`; real-time duplicate detection on name field; `companies` prop for `<datalist>`; `excludeId` for edit context
- **`EventForm`** — same pattern; no duplicate detection

### Delete / Remove buttons
- **`DeletePersonButton`**, **`DeleteEventButton`** — Client Components; `useTransition` + `window.confirm`; call a bound server action
- **`RemovePersonButton`** — reused for removing from both event-people and person-event contexts; accepts optional `confirmMessage` prop

### Linking forms
- **`LinkPersonForm`**, **`LinkEventForm`** — Client Components; `useActionState`; `<select>` of available (unlinked) records + optional note textarea
- **`EditNoteForm`** — Client Component; `useActionState`; single textarea for `encounter_note`

### Sort and search
- **`SortSelect`** — generic; requires Suspense; uses `usePathname` + `useSearchParams`
- **`SearchInput`** — generic; no Suspense needed; requires `pathname` + `defaultSort` props

### Tags, follow-ups, relationships (person page)
- **`TagPicker`** / **`TagChip`** / **`TagFilterBar`** — `src/components/tags/`; actions in `src/lib/tags/actions.ts`, queries in `src/lib/tags/queries.ts`
- **`FollowUpForm`**, **`CompleteFollowUpButton`**, **`UncompleteFollowUpButton`**, **`DeleteFollowUpButton`**, **`RescheduleFollowUpButtons`**, **`CompletedFollowUpsSection`** — `src/components/follow-ups/`; actions in `src/lib/follow-ups/actions.ts`
- **`RelationshipPicker`**, **`RemoveRelationshipButton`** — `src/components/relationships/`; actions in `src/lib/relationships/actions.ts` (note the `person_relationships` typing gap above)
- All of the above are read by `buildTimeline()` (`src/lib/people/timeline.ts`) to render the person page's unified activity timeline

### Capture / Conference Mode
- `CaptureForm` (`src/components/capture/`) + `captureAndSave()`/`linkExistingInCapture()`/`undoCapture()` (`src/lib/capture/actions.ts`) create a person (or link an existing one) and atomically attach tags, an event link, a follow-up, and "met together" relationships in one save — sequential inserts, not a single transaction, intentional for capture-speed over strict atomicity
- `src/lib/capture/queries.ts` — `getCapturedToday()`, `getRecentPeople()`, `getRecentCompanies()`, `getCurrentConference()` (also feeds the dashboard's "Current Conference" card)

---

## Server Action Patterns

All mutations are server actions (`"use server"`).

**Signatures:**

```ts
// Standard mutation (create/update with error display via useActionState)
async function createX(_prev: ActionState, formData: FormData): Promise<ActionState>
async function updateX(id: string, _prev: ActionState, formData: FormData): Promise<ActionState>

// Simple mutation (delete/remove — no error state needed in UI)
async function deleteX(id: string): Promise<void>
```

- `updateX` and similar bound actions use `.bind(null, id)` in the Server Component; the result is cast to the correct `(ActionState, FormData) => Promise<ActionState>` signature for `useActionState`
- `owner_id` is always set server-side from `getUser()`; never from form input
- `redirect()` is always called **outside** any `try/catch` block (it throws `NEXT_REDIRECT` internally)
- Belt-and-suspenders: DB mutations include `.eq("owner_id", user.id)` in addition to relying on RLS

**ActionState:**
```ts
type ActionState = { error: string | null }
```

Defined locally in each `actions.ts` file. Not shared across modules.

**File locations:**
- `src/lib/people/actions.ts` — `createPerson`, `updatePerson`, `deletePerson`
- `src/lib/events/actions.ts` — `createEvent`, `updateEvent`, `deleteEvent`
- `src/lib/event-people/actions.ts` — `linkPerson`, `linkEvent`, `removePersonFromEvent`, `removeEventFromPerson`, `updateEncounterNote`, `createPersonAndLink`, `createEventAndLink`
- `src/lib/auth/actions.ts` — `signInWithGoogle`, `signOut`
- `src/lib/tags/actions.ts` — `addTagToPerson`, `removeTagFromPerson`, `createAndAddTag`
- `src/lib/follow-ups/actions.ts` — `createFollowUp`, `updateFollowUp`, `deleteFollowUp`, `completeFollowUp`, `uncompleteFollowUp`, `snoozeFollowUp`
- `src/lib/relationships/actions.ts` — `addRelationship`, `removeRelationship`
- `src/lib/capture/actions.ts` — `captureAndSave`, `linkExistingInCapture`, `undoCapture`
- `src/lib/atlas-memory/actions.ts` — `createAtlasMemory`, `saveGoalSuggestion` (Ask Atlas networking goals)

For the Ask Atlas assistant (provider abstraction, agent loop, context tools) and Demo Mode (adapter pattern, read-only enforcement), see `PROJECT_CONTEXT.md` — those subsystems are large enough to warrant their own dedicated sections there rather than duplicating in this file.

## AI Development Instructions

Before implementing new features:

1. Read this file.
2. Reuse existing patterns whenever possible.
3. Avoid re-explaining established architecture.
4. Only describe deviations from existing patterns.
5. Keep implementation plans concise.
6. Avoid creating new dependencies unless justified.
7. Avoid schema changes unless required.