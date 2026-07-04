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
- `layout.tsx` — **authoritative auth guard**; calls `getUser()` server-side; redirects to `/login` if no session
- All app pages live here; full route tree:

```
/dashboard
/people
/people/new
/people/[id]
/people/[id]/edit
/people/[id]/link-event        # select an existing event to link
/people/[id]/add-event         # create a new event and link atomically
/events
/events/new
/events/[id]
/events/[id]/edit
/events/[id]/link-person       # select an existing person to link
/events/[id]/add-person        # create a new person and link atomically
/events/[id]/people/[personId]/edit-note   # edit encounter note for a specific link
```

### `auth/` — OAuth plumbing
- `callback/route.ts` — exchanges `?code=` for a session; redirects to `/dashboard`
- `auth-code-error/page.tsx` — fallback for failed exchanges

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

**Key indexes:** GIN on `people.search_vector`; GIN trigram on `people.name`; `(owner_id, event_date DESC NULLS LAST)` on events; `(owner_id, status, due_date)` on follow_ups.

**Postgres RPCs** (migration 006):
- `create_person_and_link(p_event_id, p_name, ...)` — atomically inserts a person and an `event_people` row
- `create_event_and_link(p_person_id, p_name, ...)` — atomically inserts an event and an `event_people` row
- Both use `SECURITY INVOKER`; RLS applies normally inside

---

## Search Architecture

### People (`/people?q=`)

Three parallel Supabase queries, merged and deduplicated by `id` in JS, sorted alphabetically:

1. `.textSearch("search_vector", q, { type: "websearch", config: "english" })` — full-text across name, company, role, notes (GIN index)
2. `.ilike("name", "%q%")` — partial/fuzzy name matching (GIN trigram index)
3. `.ilike("company", "%q%")` — partial company matching (seq scan; fast at Atlas scale)

Empty query returns all people with the current sort applied.

Query strings are pre-escaped (`%` → `\%`, `_` → `\_`) before being used in ILIKE patterns.

Implemented in `src/lib/people/queries.ts → searchPeople()`.

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




## AI Development Instructions

Before implementing new features:

1. Read this file.
2. Reuse existing patterns whenever possible.
3. Avoid re-explaining established architecture.
4. Only describe deviations from existing patterns.
5. Keep implementation plans concise.
6. Avoid creating new dependencies unless justified.
7. Avoid schema changes unless required.