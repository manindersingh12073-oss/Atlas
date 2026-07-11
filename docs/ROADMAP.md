# Atlas — Roadmap

A personal networking CRM for professionals. Atlas helps users capture the people they meet, the events they attend, and the context behind each relationship — and resurfaces that information when it matters. See `PROJECT_CONTEXT.md` for full implementation detail on everything below.

---

# Current State — Shipped

Every item that used to be a roadmap priority (follow-ups, tags, full dashboard, person-to-person relationships, network graph, and an AI layer) has shipped. Atlas is a fully working, single-user product today:

- **Authentication** — Google OAuth via Supabase Auth; protected routes; session handling
- **People & Events CRUD** — full create/read/update/delete, real-time URL-driven search and sorting for both, company suggestions, duplicate detection
- **Event ↔ Person linking** — junction table with encounter notes, atomic create-and-link RPCs, link/unlink from either side
- **Follow-ups** — per-person reminders with due date/note/status (pending/done/snoozed), overdue/due-today/upcoming/completed views on both the dashboard and person page, snooze presets
- **Tags** — free-form labels with `TagPicker`/`TagChip`, filter the people list by tag
- **Person-to-person relationships** — `person_relationships` table (met together / introduced by / works with / co-founder / friend), `RelationshipPicker` UI, feeds the person timeline and warm-intro-style suggestions
- **Dashboard** — action-focused home: stats, global search, current conference, network activity, follow-ups
- **Insights (`/insights`)** — analytics cards + the network graph
- **Network Graph** — interactive force-directed graph of people/companies/events/tags/relationships, built on React Flow, with community detection, filters, focus mode, and a details panel
- **Universal Search + Command Palette** — one search engine (people/events/companies/tags/relationships) powering the dashboard bar, People page, and `Cmd/Ctrl+K` palette
- **Capture / Conference Mode** — `/capture` and `/events/[id]/capture`: fast one-screen flow to add a person plus tags, event link, follow-up, and "met together" relationships in a single save; "Captured today" + undo
- **Ask Atlas (Atlas Assistant)** — OpenAI-backed networking copilot: global overlay (`Ctrl/Cmd+J`), contextual buttons throughout the app, Meeting Brief, prompt templates, cited structured answers, and an `atlas_memory` table for user-editable networking goals/preferences
- **Demo Mode** — the entire authenticated app explorable with zero sign-up via a cookie + adapter pattern (no duplicated pages), read-only enforcement, welcome tour
- **Backup / Export / Restore** — JSON and ZIP export of all user data; a validated restore flow that replaces the account's data
- **Settings** — Appearance (theme), Ask Atlas (networking goals), Data (export/restore), About
- **Marketing landing page** — full unauthenticated homepage at `/`, section components under `src/components/landing/`
- **RLS** — row-level security enabled and forced on every table; every query owner-scoped

---

# Database Schema

See `ARCHITECTURE.md` → "Database Tables" for the authoritative, up-to-date table list (8 migrations: `profiles`, `people`, `events`, `event_people`, `tags`, `person_tags`, `follow_ups`, `person_relationships`, `atlas_memory`, plus the two atomic-link RPCs).

---

# Design Principles

See `PRODUCT_PRINCIPLES.md` for the full list. Summary: minimise taps, optimise for standing/one-handed use, never force navigation when an action can happen in place, remember context over re-asking, relationship management over data management, reuse existing patterns before inventing new ones, avoid unnecessary dependencies.

---

# Remaining Roadmap

With the core product built, remaining work is smaller and more speculative:

1. **Proactive AI delivery** — Ask Atlas is pull-only today (user opens it). No scheduler or email/push provider exists yet to *push* reconnection nudges or meeting briefs unprompted.
2. **Calendar / LinkedIn / company-news integrations** — would feed Ask Atlas's context layer and the reconnection-suggestion tool with external signals; none exist today.
3. **Mobile app** — native or PWA with offline-first capture. No manifest, service worker, or PWA dependency exists yet; the current UI is responsive but not installable/offline.
4. **Re-run `db:types` for `person_relationships`** — the table exists and works, but wasn't present when the generated `Database` type was last regenerated, so `src/lib/relationships/actions.ts` casts `supabase as any` as a workaround. Low-risk cleanup, not a feature gap.
5. **Replace placeholder testimonials** — `src/content/testimonials.ts` on the landing page is explicitly marked for replacement with real quotes before public launch.
6. **Capture real marketing screenshots** — `public/marketing/` expects `dashboard.png`, `capture.png`, `person-profile.png`, `network-graph.png`, `insights.png`, `search.png`; until captured, the landing page renders dashed placeholders.

---

# Deferred / Out of Scope

- LinkedIn scraping or enrichment
- Automatic messaging or outreach on the user's behalf
- Multi-user / team features (Atlas is intentionally single-user, owner-scoped)
- Advanced analytics/reporting beyond the existing Insights cards

---

# Development Rules

- Reuse existing architecture wherever possible before proposing new patterns
- Do not introduce new dependencies unless the existing stack cannot cover the requirement
- Do not modify the database schema unless a new entity or relationship genuinely requires it
- Prefer extending existing server actions, query helpers, and component patterns
- Explain only non-obvious architectural decisions; skip documenting what the code already makes clear
- Keep implementation plans concise; avoid restating approved decisions
