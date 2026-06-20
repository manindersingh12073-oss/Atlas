# Atlas — Project Context

> Primary onboarding document for AI sessions. Read this first. See ARCHITECTURE.md for implementation detail and ROADMAP.md for the full feature plan.

---

## What Atlas Is

Atlas is a personal networking CRM for professionals. It helps users capture the people they meet, the events they attend, and the context behind each relationship — and resurfaces that information when it matters.

**Not** a team tool, a public directory, or a social network. Single-user, private, owner-scoped by design.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, TypeScript 6 |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` in `globals.css`, no config file) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Auth | Google OAuth (PKCE) via Supabase Auth |
| React | v19 |
| ORM | Supabase JS client (typed via generated `Database` type) |

No ORMs, no state management libraries, no component libraries. The stack is intentionally minimal.

---

## Current Implemented Features

All features below are fully working in the current codebase.

### People (Contacts)
- **CRUD** — create, read, update, delete
- **Fields** — `name` (required), `company`, `role`, `linkedin_url`, `email`, `phone`, `notes`
- **Real-time search** — URL-driven (`?q=`); FTS on `search_vector` + ILIKE name + ILIKE company; debounced 300ms
- **Sorting** — Name A-Z/Z-A, Recently Added, Oldest Added, Recently Updated, Most Events; URL-driven (`?sort=`)
- **Duplicate detection** — real-time name similarity while creating; advisory only, never blocks submission
- **Company suggestions** — datalist from existing people; case-insensitive dedup; most-frequent casing wins
- **Per-person event count** — people list shows how many events each person is linked to (resolved without N+1 queries via `getPersonEventData()`)

### Events
- **CRUD** — create, read, update, delete
- **Fields** — `name` (required), `event_date`, `location`, `description`
- **Real-time search** — URL-driven (`?q=`); ILIKE name + location + description; debounced 300ms
- **Sorting** — Most Recent, Oldest, A-Z, Z-A, Most People, Fewest People, Recently Added; URL-driven (`?sort=`)
- **Per-event people count** — events list shows how many people are linked

### Event ↔ Person Relationships
- **Link existing** — link an existing person to an event (and vice versa) via `link-person` / `link-event` sub-routes
- **Create-and-link** — atomic single action that creates a new person (or event) and links it in one step; backed by Postgres RPCs (`create_person_and_link`, `create_event_and_link`)
- **Encounter notes** — per-link note stored on the `event_people` junction row; editable after the fact
- **Unlink** — remove a person from an event (or event from a person) from either side

### Authentication
- Google OAuth only — no email/password
- Route-level protection via `(protected)/layout.tsx` (server-side `getUser()`)
- Session refresh on every request via `src/proxy.ts`
- Profiles auto-created on signup via Postgres trigger

### Dashboard (Placeholder)
- Route exists at `/dashboard` — currently shows user email, navigation links to People and Events, and a sign-out button
- **Not yet implemented**: due follow-ups, recently added people, recent events activity

### Infrastructure
- **RLS** — row-level security enabled and forced on all tables; every query is owner-scoped
- **Database types** — auto-generated via `npm run db:types`; fully typed query client

---

## Database Schema

### `profiles`
1:1 with `auth.users`. Stores `full_name` and `avatar_url`. Auto-created on signup via trigger. PK = `auth.users.id`.

### `people`
Core contact entity. `owner_id` FK. Fields: `name` (required), `company`, `role`, `linkedin_url`, `email`, `phone`, `notes`, plus a generated `search_vector` (tsvector over name + company + role + notes).

Indexes: GIN on `search_vector`; GIN trigram on `name`.

### `events`
`owner_id` FK. Fields: `name` (required), `event_date`, `location`, `description`.

Index: `(owner_id, event_date DESC NULLS LAST)`.

### `event_people`
Junction between `people` and `events`. Composite PK `(event_id, person_id)`. Stores `encounter_note` and `owner_id` (denormalized for RLS — no JOINs in policies).

### `tags`
`owner_id` FK. Fields: `name`, `color`. Unique on `(owner_id, lower(name))`. **Schema exists; feature not yet implemented in UI.**

### `person_tags`
Junction between `people` and `tags`. Composite PK `(person_id, tag_id)`. `owner_id` denormalized. **Schema exists; feature not yet implemented in UI.**

### `follow_ups`
`owner_id` + `person_id` FKs. Fields: `due_date`, `note`, `status` (`pending` / `done` / `snoozed`), `completed_at`. Index: `(owner_id, status, due_date)`. **Schema exists; feature not yet implemented in UI.**

---

## Search Functionality

Both search implementations share the same shape: parallel queries → merge → deduplicate by `id` in JS → sort alphabetically. Query strings escape `%` and `_` before being used in ILIKE patterns.

### People search — `searchPeople()` in `src/lib/people/queries.ts`
Three parallel queries:
1. `.textSearch("search_vector", q, { type: "websearch", config: "english" })` — FTS across name, company, role, notes (GIN index)
2. `.ilike("name", "%q%")` — partial name matching (GIN trigram index)
3. `.ilike("company", "%q%")` — partial company matching (seq scan; fast at this scale)

Empty query returns all people with the active sort applied.

### Events search — `searchEvents()` in `src/lib/events/queries.ts`
Four parallel queries:
1. `.ilike("name", "%q%")`
2. `.ilike("location", "%q%")`
3. `.ilike("description", "%q%")`
4. `event_people` count query — to attach `people_count` to each result

Name results are merged first so name matches appear before location or description matches. Empty query delegates to `getEvents()`.

### SearchInput component — `src/components/SearchInput.tsx`
- Generic Client Component; used by both pages
- Debounced 300ms via `useRef` timer
- `router.replace()` inside `useTransition` (shows `opacity-60` pending state during navigation)
- Accepts `pathname`, `currentSort`, `defaultSort` as props — no `useSearchParams` needed
- Wrapped in a `<form method="GET">` for Enter-key fallback
- `PeopleSearchInput` (`src/components/people/PeopleSearchInput.tsx`) is a thin wrapper binding people-specific props

---

## Sorting Functionality

URL param: `?sort=value`. Parsed server-side by `parsePeopleSort()` / `parseEventSort()`; unknown values fall back to the default.

Sort is applied at the DB level for all options **except** those requiring a count join:
- People: `events_desc` — sorted in JS after merging with `getPersonEventData()` results
- Events: `people_desc` and `people_asc` — sorted in JS after the parallel count query in `getEvents()`

**During active search** (`?q=` is set): sort is ignored (results are always alphabetical) and the `SortSelect` is visually disabled.

### SortSelect component — `src/components/SortSelect.tsx`
- Generic Client Component
- Uses `usePathname()` + `useSearchParams()` to update only `?sort=` while preserving other params
- **Must be wrapped in `<Suspense>` at every render site** (requirement of `useSearchParams`)

### Sort options

**People** (default: `name_asc`):
`name_asc`, `name_desc`, `created_desc`, `created_asc`, `updated_desc`, `events_desc`

**Events** (default: `date_desc`):
`date_desc`, `date_asc`, `name_asc`, `name_desc`, `people_desc`, `people_asc`, `created_desc`

---

## Duplicate Detection

Real-time, advisory, non-blocking. Implemented entirely in `PersonForm` (Client Component).

- On name field `onChange`: debounce 300ms → if ≥ 3 chars → browser Supabase client queries `.ilike("name", "%typed%").limit(5)`
- RLS automatically scopes the query to the authenticated user's people
- Results render in an amber advisory panel below the name field with "View →" links (open in new tab)
- Suggestions clear when name is < 3 chars or emptied
- `excludeId` prop prevents the edit page from flagging the person being edited as their own duplicate
- Form submission is never blocked

---

## Event ↔ Person Relationship Functionality

### Sub-routes
Each entity has two ways to add the other:

| Route | What it does |
|---|---|
| `/events/[id]/link-person` | Select an existing person from a dropdown; optional encounter note |
| `/events/[id]/add-person` | Create a new person and simultaneously link to this event (atomic RPC) |
| `/people/[id]/link-event` | Select an existing event from a dropdown; optional encounter note |
| `/people/[id]/add-event` | Create a new event and simultaneously link to this person (atomic RPC) |
| `/events/[id]/people/[personId]/edit-note` | Edit the encounter note for a specific person↔event link |

### Atomic create-and-link (Postgres RPCs)
- `create_person_and_link(p_event_id, p_name, ...)` — inserts person + event_people row in one implicit transaction
- `create_event_and_link(p_person_id, p_name, ...)` — inserts event + event_people row in one implicit transaction
- Both use `SECURITY INVOKER`; RLS applies inside; no privilege escalation
- Defined in migration `20260616000001_rpc_create_and_link.sql`

### Server actions
All in `src/lib/event-people/actions.ts`:
`linkPerson`, `linkEvent`, `removePersonFromEvent`, `removeEventFromPerson`, `updateEncounterNote`, `createPersonAndLink`, `createEventAndLink`

### Components
- `LinkPersonForm` / `LinkEventForm` — `<select>` of available (unlinked) records + optional note textarea; `useActionState`
- `EditNoteForm` — single textarea for `encounter_note`; `useActionState`
- `RemovePersonButton` — used for unlinking from both directions; accepts optional `confirmMessage` prop

---

## Authentication Approach

1. User clicks "Continue with Google" → `signInWithGoogle()` server action → Supabase OAuth → redirect to Google
2. Google redirects to `/auth/callback?code=...`
3. Callback route exchanges code for session → sets cookies → redirects to `/dashboard`
4. `src/proxy.ts` calls `updateSession()` on every non-static request to refresh tokens
5. `(protected)/layout.tsx` re-validates session server-side on every protected page render (defence in depth)
6. `signOut()` server action → clears session → redirect to `/login`

**Redirect rules** (in `src/lib/supabase/middleware.ts`):
- Unauthenticated + non-public path → `/login`
- Authenticated + `/login` → `/dashboard`
- Public paths: `/`, `/login`, `/auth/*`

`owner_id` is always set server-side from `getUser()`. It is never accepted from client input.

---

## Supabase Architecture

### Three client variants (all in `src/lib/supabase/`)

| File | Used in | Notes |
|---|---|---|
| `server.ts` | Server Components, Server Actions, Route Handlers | `createServerClient`; reads/writes cookies via `next/headers`; fresh per request |
| `client.ts` | Client Components | `createBrowserClient`; reads session from cookies |
| `middleware.ts` | `proxy.ts` only | `createServerClient` with req/res cookie wrappers; calls `getUser()` for token refresh |

All clients typed with the generated `Database` type from `src/types/database.types.ts`.

### RLS approach
Every table: `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`. Four policies per table (SELECT / INSERT / UPDATE / DELETE).
- Primary tables (`people`, `events`, `tags`, `follow_ups`): `owner_id = auth.uid()`
- Junction tables (`event_people`, `person_tags`): `owner_id` denormalized; same policy — no JOINs in policies
- `profiles`: `id = auth.uid()`
- UPDATE policies carry both `USING` and `WITH CHECK` to prevent ownership reassignment

### Environment variables
- `NEXT_PUBLIC_SUPABASE_URL` — safe to expose
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to expose; RLS enforces security
- `NEXT_PUBLIC_SITE_URL` — OAuth redirect URL base
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; bypasses RLS; **not yet used in application code**

Validated in `src/lib/env.ts`; startup fails loudly if missing.

---

## Development Conventions

### Component model
- **Server Components** by default for data fetching
- **Client Components** only where interactivity is required (`"use client"` at the top)
- Pattern: Server page fetches data → passes to Client Component as props

### Server actions
All mutations are server actions (`"use server"`).

Signatures:
```ts
// Create/update — error state flows through useActionState
async function createX(_prev: ActionState, formData: FormData): Promise<ActionState>
async function updateX(id: string, _prev: ActionState, formData: FormData): Promise<ActionState>

// Delete/remove — no UI error state needed
async function deleteX(id: string): Promise<void>
```

`updateX` and similar: bound with `.bind(null, id)` in the Server Component; cast to the correct signature for `useActionState`.

`redirect()` always called **outside** any `try/catch` (it throws `NEXT_REDIRECT` internally).

DB mutations include `.eq("owner_id", user.id)` even though RLS already enforces it (belt-and-suspenders).

`ActionState = { error: string | null }` — defined and exported independently in each `actions.ts`; not shared across modules.

`nullable(formData, key)` — private helper in each actions file; converts empty form strings to `null` for optional DB columns.

### URL-driven state
Search (`?q=`) and sort (`?sort=`) are URL params, not React state. This makes pages shareable, bookmarkable, and server-rendered. Client components update the URL via `router.replace()`.

### Path alias
`@/*` → `src/*` throughout.

---

## Reusable Patterns Already Established

When building new features, mirror these patterns from People/Events rather than inventing new ones.

### Query pattern
```ts
// src/lib/<entity>/queries.ts
export async function searchX(supabase, query, sort): Promise<XResult[]>
export async function getX(supabase, sort): Promise<XResult[]>
export type XSort = "..." | "..."
export const X_SORT_OPTIONS = [...]
export const DEFAULT_X_SORT: XSort = "..."
export function parseXSort(value: string | undefined): XSort
```

### Action pattern
```ts
// src/lib/<entity>/actions.ts
"use server"
export type ActionState = { error: string | null }
export async function createX(_prev: ActionState, formData: FormData): Promise<ActionState>
export async function updateX(id: string, _prev: ActionState, formData: FormData): Promise<ActionState>
export async function deleteX(id: string): Promise<void>
```

### Form component pattern
```tsx
// src/components/<entity>/XForm.tsx
"use client"
// useActionState for error display
// uncontrolled inputs with defaultValue
// action passed as prop (bound in Server Component)
```

### Delete button pattern
```tsx
// src/components/<entity>/DeleteXButton.tsx
"use client"
// useTransition + window.confirm
// calls a bound server action
```

### Page pattern
```tsx
// src/app/(protected)/<entity>/page.tsx
// Server Component
// reads ?q= and ?sort= from searchParams
// fetches data server-side
// renders <Suspense> around <SortSelect>
// renders <SearchInput> with pathname and defaultSort props
```

---

## Current Roadmap Priorities

In order (see ROADMAP.md for full detail):

1. **Follow-ups** — reminders per person with due date, note, and status; overdue view on dashboard. Schema (`follow_ups` table) already exists.
2. **Tags** — label people with free-form tags; filter people list by tag. Schema (`tags`, `person_tags` tables) already exists.
3. **Dashboard (full)** — the route exists as a placeholder; needs due follow-ups, recently added people, and recent events.
4. **Person-to-person relationships** — record how two people know each other; warm intro paths.
5. **Network graph** — visual map of people and events.
6. **Mobile app** — native or PWA with offline-first capture.
7. **AI features** — follow-up drafting, smart resurfacing, relationship scoring.

Items 1 and 2 are highest priority and have pre-built schema support.
