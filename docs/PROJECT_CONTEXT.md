# Atlas — Project Context

> Primary onboarding document for AI sessions. Read this first. See ARCHITECTURE.md for implementation detail and ROADMAP.md for the full feature plan.

---

## What Atlas Is

Atlas is **the networking memory assistant**. It helps professionals capture the people they meet, the events they attend, and the context behind each relationship — and resurfaces that information when it matters.

**Not** a team tool, a public directory, or a social network. Single-user, private, owner-scoped by design.

Core proposition: *You leave a conference. You open Atlas. You remember everyone.*

---

## Landing Page (`/`)

A full marketing homepage for unauthenticated visitors, positioning Atlas as **"the networking memory assistant"** (not a CRM). Authenticated users are redirected to `/dashboard` by both the middleware and the page itself.

`src/app/page.tsx` is now a thin composition root: it does the auth-redirect check and renders section components from `src/components/landing/` in order. All copy lives in typed `src/content/*.ts` files — editing a section's content should never require touching JSX.

**Sections (in render order):**
1. **`Nav`** — sticky header: Product, How it works, Use cases, Pricing (Coming Soon), Feedback, Sign in
2. **`Hero`** — "Never forget the people you meet." + CTA pair + the real Person Profile screenshot (`ScreenshotFrame`)
3. **`ProblemSection`** — "Networking is easy. Remembering isn't." — 3 cards (Meet / Forget / Reconnect), doubling as the page's story arc
4. **`ProductTour`** (`#product`) — 5 alternating-row sections, each a real screenshot (Dashboard, Capture, Network Graph, Insights, Search) + an outcome headline. This plus the Hero's Person Profile shot cover all 6 real screenshots the page uses.
5. **`WorkflowSection`** (`#how-it-works`) — Attend → Open Atlas → Capture → Atlas organises → Reconnect, from `src/content/workflow.ts`
6. **`UseCasesSection`** (`#use-cases`) — 4 illustrative scenario cards (Startup Demo Day, VC Networking Event, Medical Conference, Research Symposium) from `src/content/useCases.ts`
7. **`FeaturesSection`** — 6 secondary-capability cards (relationships, follow-ups, tags, export, mobile, duplicate detection) from `src/content/features.ts` — deliberately doesn't repeat the Product Tour's screens
8. **`ComparisonSection`** — Without Atlas vs With Atlas, from `src/content/comparison.ts`
9. **`AudienceSection`** — persona chips, from `src/content/audience.ts`
10. **`FounderStorySection`** — "Why Atlas exists," from `src/content/founderStory.ts`
11. **`TestimonialsSection`** — 3 placeholder quotes from `src/content/testimonials.ts` (marked for replacement before launch)
12. **`DemoSpotlight`** — dedicated Demo Mode callout with live counts (people/events/relationships) read from `src/lib/demo/dataset.ts` via `CountUpStat`, plus a prominent Try Demo button
13. **`FaqSection`** — 6 questions from `src/content/faqs.ts`, using `<details>/<summary>` (no JS required)
14. **`FinalCta`** — "Start remembering every conversation." + CTA pair
15. **`Footer`** — Privacy, Terms, Feedback, Version

**Content files** (`src/content/`): `testimonials.ts`, `faqs.ts`, `features.ts`, `useCases.ts`, `founderStory.ts`, `workflow.ts`, `comparison.ts`, `audience.ts`, `screenshots.ts` — each typed, each with a header comment on how to add an entry.

**Real screenshots — `src/components/landing/ScreenshotFrame.tsx`:** a Server Component that resolves `public/marketing/<filename>` via `node:fs`. If the file exists, it renders inside a minimal browser-chrome frame via `next/image`; if not, it renders a same-sized dashed placeholder ("Screenshot coming soon") so `next dev`/`next build` never fail on a missing file. `src/content/screenshots.ts` is the single source of truth for filenames/alt text/which page to capture. Required files: `dashboard.png`, `capture.png`, `person-profile.png`, `network-graph.png`, `insights.png`, `search.png` — capture via Demo Mode at ~1440px, drop into `public/marketing/`, no code changes needed.

**Motion** — two dependency-free Client Components in `src/components/landing/`:
- `ScrollReveal` — `IntersectionObserver`-driven fade + lift-in, triggers once, respects `motion-reduce:`
- `CountUpStat` — same trigger, `requestAnimationFrame` easing count-up, jumps straight to the final value under `prefers-reduced-motion`

**Shared CTA — `src/components/landing/SignInButton.tsx`:** exports `SignInButton` (Google OAuth form), and `CtaButtonGroup` (the Start free / Try Demo pair), reused identically by the Hero, `DemoSpotlight`, and `FinalCta`.

**Implementation notes:**
- All sign-in buttons use `<form action={signInWithGoogle}>` — no intermediate `/login` step for CTAs
- **"Try Demo"** (`<Link href="/demo">`) is a plain navigation to the Demo Mode entry route — see "Demo Mode" below
- `scroll-behavior: smooth` on the root div for anchor navigation
- `src/lib/supabase/middleware.ts` redirects authenticated users on both `/` and `/login` to `/dashboard`
- Color palette is intentionally unchanged from the rest of the app (gray neutrals + a single blue accent for CTAs; no purple/violet anywhere on the page)

---

## Demo Mode

Lets anyone explore the full authenticated app at `/dashboard`, `/people`, `/events`, `/insights`, etc. — with zero sign-up — by swapping the data source, not the route tree. **No Atlas page is duplicated for Demo Mode.**

**Entry/exit:**
- `GET /demo` (`src/app/demo/route.ts`) sets an httpOnly `atlas_demo=1` cookie (30-day expiry) and redirects to `/dashboard`. Linked from the landing page's "Try Demo" CTAs.
- `GET /demo/exit?next=<path>` (`src/app/demo/exit/route.ts`) clears the cookie and redirects (defaults to `/login`). Used by the "Exit demo" nav link, the demo banner, and the read-only notice's "Create my Atlas" button.
- `src/lib/supabase/middleware.ts` and `(protected)/layout.tsx` both treat a valid `atlas_demo` cookie as authorization when there is no real Supabase session — a real session always takes precedence. `isDemoMode()` (`src/lib/demo/session.ts`) is the one server-side check every page/route uses.

**Data source — the adapter pattern:**
- `public/demo/atlas-demo.json` is the single source of truth: a file in the exact Atlas backup format (`meta`/`profile`/`people`/`events`/`event_people`/`tags`/`person_tags`/`follow_ups`/`relationships`) that also passes `validateBackup()`. Regenerate it with `python tools/generate_demo_data.py --size demo --seed <n> --output public/demo` (see Development Tooling below) — no code changes required.
- `src/lib/demo/dataset.ts` imports that JSON once (module-level singleton) and indexes it (`peopleById`, `eventsById`, `tagsById`).
- `src/lib/demo/queries.ts` is a pure-JS mirror of every Supabase-backed query function Atlas pages use (`searchPeopleDemo`, `getDashboardDataDemo`, `getNetworkGraphDataDemo`, `getGraphNodeDetailDemo`, etc.) — same function shapes as their real counterparts, computed over the in-memory dataset instead of SQL.
- Every protected page branches once, at the top, on `await isDemoMode()`: call the `*Demo` query function or the real Supabase-backed one, then render identically either way. Components never know which source produced their props. `/api/search`, `/api/search/suggestions`, `/api/graph/node`, `/api/export/json`, and `/api/export/zip` branch the same way (Export must work in Demo Mode — see Welcome Tour below).

**Read-only enforcement:**
- Demo visitors have no real Supabase session, so every server action's own `getUser()` check already fails closed — a write that somehow reached the server redirects to `/login` rather than mutating anything. This is a safety net, not the primary UX.
- The primary UX is `src/lib/demo/context.tsx`: `DemoModeProvider`/`useDemoMode()` (a React context set once in `(protected)/layout.tsx`) and `useDemoGuard()`, a hook every write-triggering leaf component (`DeletePersonButton`, `DeleteEventButton`, `RemovePersonButton`, `*FollowUpButton`, `RemoveRelationshipButton`, `TagPicker`, `TagChip`, `RelationshipPicker`, `RestoreSection`) calls before invoking its bound server action. In Demo Mode the action is never called — `dispatchDemoBlocked()` fires the `atlas:demo-blocked` window event instead (same idiom as the existing `atlas:command-palette` / `atlas:shortcuts` events).
- `DemoModeModal` (mounted once in the protected layout) listens for that event and shows the read-only notice as an overlay.
- Routes that are *entirely* about writing (`/people/new`, `/people/[id]/edit`, `/people/[id]/link-event`, `/people/[id]/add-event`, `/people/[id]/follow-ups/new`, `/people/[id]/follow-ups/[id]/edit`, `/events/new`, `/events/[id]/edit`, `/events/[id]/link-person`, `/events/[id]/add-person`, `/events/[id]/people/[id]/edit-note`, `/capture`, `/events/[id]/capture`) each check `isDemoMode()` first and render `<DemoBlockedPage>` instead of the real form — reached the same way whether the visitor clicked a link, used the Command Palette, typed a keyboard shortcut, or entered the URL directly, since none of those are intercepted separately.
- Both the full-page and overlay notices render the same `DemoBlockedNotice` copy/CTA component.

**Banner + welcome tour:**
- `DemoBanner` — persistent strip below `TopNav` when `isDemo`.
- `DemoWelcomeTour` — a dismissible bottom-right checklist (8 suggested actions, e.g. "Search for Sarah", "View the Network Graph"), self-reported (click a row to check it off) rather than auto-detected. Progress and dismissal persist in `localStorage` (`atlas:demo-tour-progress` / `atlas:demo-tour-dismissed`); reopen it from Settings via `ReplayTourButton`, which dispatches `atlas:demo-tour-reopen`.

**Showcase dataset:** ~40 people / 10 events / ~100 event links / 20 tags / ~70 tag links / ~35 follow-ups / ~90 relationships spanning Healthcare, AI, Research, Universities, Startups, Investors, and Consulting. One person ("Sarah Okafor", founder of an AI-diagnostics startup) is deliberately the highest-degree node in the graph (most events, relationships, tags, and a pending follow-up) so the welcome tour's first steps land somewhere impressive; a handful of "bridge" people span two communities so the network graph shows connected clusters rather than isolated islands.

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

No ORMs, no state management libraries, no component libraries. The stack is intentionally minimal. The one UI dependency is **`@xyflow/react` (React Flow)**, used solely for the Insights network graph.

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

### Dashboard
Action-focused home at `/dashboard`. Contains only:
- **Statistics cards** — People / Events / Relationships / Pending follow-ups; each is a navigation card with an actionable subtitle (e.g. "3 added this week", "Last: <event>", "N overdue")
- **Global network search** — a prominent search bar below the stats cards; see "Global Dashboard Search" below
- **Current Conference** — shown only when people were captured today
- **Network Activity** — recently added people
- **Follow-ups** — overdue / due today / upcoming, plus completed

Network Insights (analytics) has moved off the dashboard to its own **`/insights`** page (added to the main nav). The dashboard intentionally favours action over analytics.

### Insights (`/insights`)
The visual centre of Atlas. Two parts:
- **Network Graph** (top) — a large interactive force-directed graph of the whole network (people, companies, events, tags + their connections). See "Network Graph" below.
- **Network Insights** (below) — the analytics cards (unique companies, tags, completed follow-ups, most common tag, most represented company, avg. people per event) using the existing `getDashboardData()` computation.

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

Both search implementations share the same shape: parallel queries → merge → deduplicate by `id` in JS → order (People by rank then alphabetical; Events alphabetical). Query strings escape `%` and `_` before being used in ILIKE patterns.

### People search (Universal) — `searchPeople()` in `src/lib/people/queries.ts`
Searches across the full network in two rounds. Empty query returns all people with the active sort applied.

**Round 1 — five parallel queries:**
1. FTS on `search_vector` (`websearch`, `english`) — name, company, role, notes via GIN index
2. `.ilike("name", "%q%")` — partial name matching via GIN trigram index
3. `.ilike("company", "%q%")` — partial company matching (seq scan)
4. `person_tags` → `tags!inner` join, filtered by `tags.name ilike "%q%"` — returns people with matching tag names
5. `event_people` → `events!inner` join, filtered by `events.name ilike "%q%"` — returns people who attended matching events

**Round 2 — conditional (only when Round 1 name matches exist):**
6. `person_relationships` join (both sides with `people` data), filtered by `person_a.in.(nameMatchIds) OR person_b.in.(nameMatchIds)` — surfaces people related to name-matched people

**Ranking** — each person is scored by the strongest signal they match (best/lowest wins), tie-broken alphabetically:
`0` exact name · `1` partial name · `2` company · `3` tags · `4` events · `5` relationships · `6` notes/role (FTS-only). This is the single ranking used everywhere search appears.

Search examples:
- `"Google"` → people whose company contains Google
- `"Healthcare AI Summit"` → attendees of that event
- `"Founder"` → people with Founder tag, role, or notes mentioning Founder
- `"Ali"` → Ali plus anyone with a recorded relationship with Ali

### Atlas Search v1 — one engine, four surfaces
There is exactly **one** search engine. It powers the dashboard search bar, the People-page search bar, the empty-state suggestions, and the command palette. No surface reimplements search.

**Server engine** — `src/lib/search/queries.ts`:
- `searchNetwork(supabase, q)` → `{ people, companies, tags, events, relationships }`. **People** is `searchPeople()` (the ranked Universal Search above); **Companies / Tags / Events** are one lightweight `ilike` query each; **Relationships** is one query for all edges (with both endpoints' names) filtered by name match in JS. All run in parallel — no N+1.
- `getSearchSuggestions(supabase)` → `{ recentEvents, popularTags, topCompanies }` for the empty state.
- **APIs**: `GET /api/search?q=` (grouped results) and `GET /api/search/suggestions` (empty-state suggestions). Both owner-scoped via RLS.

**Shared client layer** — `src/components/search/`:
- `useNetworkSearch()` — the one client hook: query state, 200ms debounced fetch to `/api/search` (race-guarded), loading, and the localStorage recent-viewed list.
- `useListNav()` — shared keyboard navigation over the flattened item list. Tracks the active row by **key** (not index) so new results don't need a reset effect. Supports ↑ ↓ Enter Escape Tab.
- `items.ts` — the shared `Item`/`Section` model, per-type builders, the command `Actions`, and `flattenUnique()` (cross-group dedupe).
- `SearchResultsList.tsx` — presentational grouped list (headings + rows + active highlight), reused by both surfaces.
- `UniversalSearchBar.tsx` — the inline bar used on the **dashboard and People page**. Empty+focused shows suggestions (Recently viewed / Recent Events / Popular Companies / Popular Tags); typing shows live groups **People → Events → Companies → Tags → Relationships**. Enter with no selection runs the full People search (`/people?q=`). `rounded-xl`, `.atlas-dropdown` animation, mobile-responsive.
- `CommandPalette.tsx` — global modal, opened with **Cmd/Ctrl + K** (mounted in `(protected)/layout.tsx`). Same engine; sections **People → Events → Companies → Tags → Actions**. Actions: Dashboard, People, Events, Capture, Insights, Settings, New Person, New Event, Capture Person. Suggestions load lazily on first open. ESC / click-outside / Cmd+K close. Also opens on the `atlas:command-palette` window event.

**Discoverability** — `CommandPaletteTip` (`src/components/dashboard/CommandPaletteTip.tsx`) shows a one-time dismissible hint in the dashboard's top-right on first visit (dismissal stored in `localStorage` key `atlas:cmdk-tip-dismissed`). Its "Try it" button dispatches `atlas:command-palette` to open the palette. Settings › About also documents the palette + navigation shortcuts.

Navigation targets (all surfaces): person → `/people/[id]`, company → `/people?q=<name>`, tag → `/people?tags=<id>`, event → `/events/[id]`, relationship → the related person's page.

**Recent-viewed people** — `src/lib/search/recent-people.ts` (`readRecentPeople` / `recordPersonView`) persists the last 5 viewed people in `localStorage` (key `atlas:recent-people`). `RecordPersonView` (mounted on the person detail page) writes on view. No DB table or dependency.

### Events search — `searchEvents()` in `src/lib/events/queries.ts`
Four parallel queries:
1. `.ilike("name", "%q%")`
2. `.ilike("location", "%q%")`
3. `.ilike("description", "%q%")`
4. `event_people` count query — to attach `people_count` to each result

Name results are merged first so name matches appear before location or description matches. Empty query delegates to `getEvents()`.

### SearchInput component — `src/components/SearchInput.tsx`
- Generic Client Component; used by the **Events page** for in-place `?q=` list filtering (the People page now uses `UniversalSearchBar` instead)
- Debounced 300ms via `useRef` timer
- `router.replace()` inside `useTransition` (shows `opacity-60` pending state during navigation)
- Accepts `pathname`, `currentSort`, `defaultSort` as props — no `useSearchParams` needed
- Wrapped in a `<form method="GET">` for Enter-key fallback

---

## Network Graph (Insights)

An interactive force-directed graph of the entire network, at the top of `/insights` — built as an **exploration tool**, not just a picture. Built on **React Flow (`@xyflow/react`)**; only its styling and graph generation are customised (zoom / pan / drag / viewport / minimap come from the library). Responsibilities are deliberately separated:

**1. Data generation** — `src/lib/graph/queries.ts → getNetworkGraphData(supabase)`
- Six parallel, owner-scoped reads (people, events, tags, event_people, person_tags, person_relationships) — no N+1.
- Produces `{ nodes, edges, stats }`. Node kinds: `person` (blue), `company` (orange), `event` (green), `tag` (purple). Companies are derived from `people.company` (no company table). Edges: person↔company, person↔event, person↔tag, person↔person (relationship — carries `relType`).
- Computes each node's `degree` (→ size) and per-node tooltip counts, plus `stats` (most-connected person/company/event by degree, largest connected community via union-find, total connections) — all once, so rendering never recomputes.

**2. Layout** — `src/lib/graph/layout.ts` (pure, no React)
- `NODE_COLORS`, relationship-type colours (`RELATIONSHIP_TYPE_COLORS` / `_LABELS` / `relationshipColor()`), `nodeSize(degree)` (wide range so hubs stand out), and `computeForceLayout()`.
- **Community layout**: `detectCommunities()` runs dependency-free **label propagation**; the force layout seeds each community on a ring and adds a gentle gravity toward its community centre, so natural clusters (companies, events, circles) separate instead of forming one hairball, with bridge nodes settling between clusters. Still a seeded/deterministic Fruchterman–Reingold core; iteration count scales down for larger graphs. No `d3-force` dependency.

**3. Node detail (lazy)** — `src/lib/graph/detail.ts` + `GET /api/graph/node?id=`
- `getGraphNodeDetail()` fetches **person** or **event** detail on click only (reuses `getPersonTags` / `getPersonRelationships` / `getPersonFollowUps` — no duplicated queries). Company & tag panels are derived client-side from the already-loaded graph, so they need no query.

**4. Rendering** — `src/components/graph/`
- `nodes.tsx` — custom circular node (sized/coloured from data; `data.highlighted` ring; hidden centred handles so edges join node centres).
- `GraphCanvas.tsx` — the React Flow surface: `<Background>`, `<Controls>` (zoom), `<MiniMap>` (coloured by node kind), `onlyRenderVisibleElements`, plus Panels for **Reset layout** / **Fit to screen** and the two-part **legend** (node kinds + relationship-type colours). Relationship edges are coloured by type; other edges neutral grey.
- `NetworkGraphSection.tsx` — SSR boundary; `dynamic(..., { ssr: false })` with a skeleton (React Flow and the layout run client-only).

**5. Interaction** — `src/components/graph/NetworkGraph.tsx` + `DetailsPanel.tsx`
- Owns filter / selection / **graph-search** / tooltip state. A single `paint(selectedId, matchIds, layers)` derives all node/edge visuals; every state change happens in event handlers (no setState-in-effect).
- **Graph search box** — typing highlights matching nodes and fades the rest immediately (client-side over loaded nodes).
- **Filter chips** (People / Companies / Events / Tags / Relationships) toggle each layer via node/edge `hidden`.
- **Focus mode** — click highlights the node + neighbours, dims the rest, highlights connected edges.
- **Details panel** (`DetailsPanel.tsx`) opens beneath the graph on click and adapts by kind — Person (company, role, notes, tags, events, relationships, follow-ups, created date, open-profile button), Company (people, connected events, top contacts, search button), Event (date, location, description, attendees, open button), Tag (people count + list). Chips inside the panel re-select nodes for chained exploration.
- **Hover** → tooltip. **Double-click** → navigate (person/event page, company/tag filtered search). **Pane click / close** → clear selection. **Reset layout** → restore computed positions + clear selection/search + refit.
- **Graph statistics** row is read straight from `stats` (reuses the data-generation calculation — not recomputed).
- **`GraphHelpPanel.tsx`** — a collapsible "How to use the Network Graph" panel above the graph, expanded on first visit and permanently dismissible ("Don't show again", `localStorage` key `atlas:graph-help-dismissed`).

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

## List Performance (progressive loading)

Long lists render only a window of items via `ProgressiveList` (`src/components/ui/ProgressiveList.tsx`), a shared Client Component. Applied to **People**, **Events**, and every dashboard **Follow-ups** list (overdue / due today / upcoming groups + completed).

- Server pages fetch data as before (no new queries) and pass their already-rendered `<li>` rows as an `items: ReactNode[]` prop; `ProgressiveList` slices to the visible window, so thousands of cards are never mounted at once.
- **Page size** selector: 25 / 50 / 100 / 250 / All, default **50**, remembered per-list in `localStorage` (`atlas:pagesize:{people|events|followups}`). The stored preference is applied post-mount via `requestAnimationFrame` to avoid an SSR/hydration mismatch.
- **"Load more"** appends another batch equal to the page size (progressive, not paginated); shows the remaining count.
- Header shows **"Showing X of Y {label}"**.
- **Search** (`showAll` prop, set from `?q=`) bypasses paging and shows the entire matched set; because the component keeps its `loaded` state across re-renders, clearing search returns to the previously loaded amount.
- The completed-follow-ups list fetches up to 1000 rows (`getDoneFollowUps(supabase, 1000)`) so the count and "Load more" are meaningful.
- The dashboard's active follow-up groups (overdue / due today / upcoming) use `compact` mode: the count + page-size control only appear when a group exceeds one page, so short groups stay clean while a long Overdue list still pages. All follow-up lists share one page-size preference (`atlas:pagesize:followups`).

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
5. **Network graph** — ✅ shipped: interactive force-directed graph on `/insights` (see "Network Graph").
6. **Mobile app** — native or PWA with offline-first capture.
7. **AI features** — follow-up drafting, smart resurfacing, relationship scoring.

Items 1 and 2 are highest priority and have pre-built schema support.

---

## Development Tooling

### Demo Data Generator

Located at `tools/generate_demo_data.py`. Generates realistic Atlas backup files
that can be imported via Atlas Restore.

**Install:**
```bash
pip install -r requirements-demo.txt
```

**Usage:**
```bash
python tools/generate_demo_data.py --size small
python tools/generate_demo_data.py --size medium --seed 42
python tools/generate_demo_data.py --size large --seed 42 --output demo-data/
python tools/generate_demo_data.py --size demo --seed 42 --output public/demo
```

Outputs `demo-data/atlas-demo-{size}.json`. All sizes match Atlas Restore's
validation requirements exactly (no dangling FKs, no duplicate junction rows,
all required fields present).

| Size   | People | Events | Event links | Tags | Tag links | Follow-ups | Relationships |
|--------|--------|--------|-------------|------|-----------|------------|---------------|
| small  | 30     | 8      | 70          | 12   | 55        | 20         | 30            |
| medium | 350    | 75     | 900         | 45   | 800       | 280        | 400           |
| large  | 2500   | 500    | 7500        | 80   | 6500      | 2000       | 3500          |
| demo   | 40     | 10     | ~100        | 20   | ~65       | 35         | ~80           |

The `demo` size additionally runs a showcase-curation pass (`config.showcase = True`
in `tools/demo_data/config.py`) that guarantees a single dominant hub person, a few
cross-community bridge people, and all 5 relationship types are represented — see
"Demo Mode" above. Its output must land at exactly `public/demo/atlas-demo.json`
(rename `atlas-demo-demo.json` if the generator's default naming is used) since
that exact path is imported directly by `src/lib/demo/dataset.ts`.

The generator uses a community model (tech / healthcare / academia / biotech /
founders / VC / consulting) to produce realistic professional networks rather
than random data. Same `--seed` always produces byte-identical output.

See `tools/demo_data/README.md` for full documentation.
