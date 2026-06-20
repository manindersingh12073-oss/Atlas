# Atlas

A personal networking CRM for professionals. Atlas helps users capture the people they meet, the events they attend, and the context behind each relationship — and resurfaces that information when it matters.

---

# Current State

## Implemented Features

- **Authentication** — Google OAuth via Supabase Auth; protected routes; session handling
- **Profiles** — auto-created on signup; 1:1 with `auth.users`
- **People CRUD** — create, read, update, delete; all seven fields; company suggestions via datalist
- **Events CRUD** — create, read, update, delete; name, date, location, description
- **Event ↔ Person linking** — via `event_people` junction; encounter notes per link; create-and-link in one action (atomic RPC); link/unlink from both sides
- **Search (People)** — real-time, URL-driven (`?q=`); FTS on `search_vector` + ILIKE name + ILIKE company; debounced
- **Search (Events)** — real-time, URL-driven (`?q=`); ILIKE name + location + description; debounced
- **Sorting (People)** — Name A-Z/Z-A, Recently Added, Oldest Added, Recently Updated, Most Events; URL-driven (`?sort=`)
- **Sorting (Events)** — Most Recent, Oldest, A-Z, Z-A, Most People, Fewest People, Recently Added; URL-driven (`?sort=`)
- **Duplicate detection** — real-time name similarity check while creating a person; advisory only; never blocks
- **Company suggestions** — datalist populated from existing people; case-insensitive dedup; most-frequent casing wins
- **RLS** — row-level security enabled and forced on all tables; every query is owner-scoped

---

# Database Schema

### `profiles`
One row per user. Linked 1:1 to `auth.users`. Stores display name and avatar. Auto-created on signup via trigger.

### `people`
Core entity. Fields: `name` (required), `company`, `role`, `linkedin_url`, `email`, `phone`, `notes`. Includes a generated `search_vector` (tsvector) over name, company, role, and notes, with GIN index. GIN trigram index on `name` for fuzzy matching.

### `events`
Fields: `name` (required), `event_date`, `location`, `description`. Indexed by `(owner_id, event_date DESC NULLS LAST)`.

### `event_people`
Junction between `people` and `events`. Composite PK `(event_id, person_id)`. Stores `encounter_note` and `owner_id` (denormalized for RLS). Two Postgres RPC functions handle atomic create-and-link: `create_person_and_link` and `create_event_and_link`.

### `tags`
User-defined labels. Fields: `name`, `color`. Unique constraint on `(owner_id, lower(name))`.

### `person_tags`
Junction between `people` and `tags`. Composite PK `(person_id, tag_id)`. `owner_id` denormalized for RLS.

### `follow_ups`
Reminder records linked to a person. Fields: `due_date`, `note`, `status` (`pending` / `done` / `snoozed`), `completed_at`. Indexed by `(owner_id, status, due_date)` to drive the dashboard query.

---

# Design Principles

- **Mobile-first eventually** — current UI is desktop-tolerant; mobile layout is a later priority
- **Fast capture** — minimise the steps between meeting someone and recording them
- **Minimise friction** — required fields are kept to a minimum; optional fields are progressively disclosed
- **Reuse existing patterns before creating new ones** — new features should mirror People/Events CRUD unless there is a specific reason not to
- **Prefer server components** — data fetching belongs on the server; Client Components are used only where interactivity is required
- **Avoid unnecessary dependencies** — no new packages without justification; the existing stack (Next.js, Supabase, Tailwind) covers almost every need
- **Keep architecture simple** — server actions for mutations, server components for data fetching, URL params for state, RLS for security
- **Use existing CRUD and search patterns** — new entities should follow the People/Events implementation as a reference

---

# Planned Features

In priority order:

1. **Follow-ups** — reminders per person with due date, note, and status; overdue view on dashboard. Database schema (`follow_ups` table with `pending` / `done` / `snoozed` status) already exists; UI not yet built.
2. **Tags** — label people with free-form tags; filter people list by tag. Database schema (`tags`, `person_tags` tables) already exists; UI not yet built.
3. **Dashboard (full)** — the `/dashboard` route exists as a navigation placeholder (user email + links to People and Events); needs due follow-ups, recently added people, and recent events activity to become the intended home screen.
4. **Person-to-person relationships** — record how two people know each other; warm intro paths
5. **Network graph** — visual map of people and events
6. **Mobile app** — native or PWA with offline-first capture
7. **AI features** — follow-up message drafting; smart resurfacing; relationship scoring

---

# Deferred Features

- LinkedIn scraping or enrichment
- Automatic messaging or outreach
- Email integration
- AI-generated contact summaries
- Advanced analytics and reporting

---

# Development Rules

- Reuse existing architecture wherever possible before proposing new patterns
- Do not introduce new dependencies unless the existing stack cannot cover the requirement
- Do not modify the database schema unless a new entity or relationship genuinely requires it
- Prefer extending existing server actions, query helpers, and component patterns
- Explain only non-obvious architectural decisions; skip documenting what the code already makes clear
- Keep implementation plans concise; avoid restating approved decisions
