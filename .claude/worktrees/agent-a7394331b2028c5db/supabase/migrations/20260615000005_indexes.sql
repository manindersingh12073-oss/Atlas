-- ─────────────────────────────────────────────────────────────
-- Migration 005: Indexes and search infrastructure
-- All indexes use IF NOT EXISTS — safe to re-run.
-- ─────────────────────────────────────────────────────────────

-- ── people ────────────────────────────────────────────────────
-- Primary ownership lookup (used by every RLS policy and list query).
CREATE INDEX IF NOT EXISTS people_owner_id_idx
  ON public.people (owner_id);

-- Full-text search over name + company + role + notes.
CREATE INDEX IF NOT EXISTS people_search_vector_idx
  ON public.people USING GIN (search_vector);

-- Fuzzy / partial name matching via pg_trgm.
CREATE INDEX IF NOT EXISTS people_name_trgm_idx
  ON public.people USING GIN (name gin_trgm_ops);

-- ── events ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS events_owner_id_idx
  ON public.events (owner_id);

-- Events list sorted by date descending (most recent first).
CREATE INDEX IF NOT EXISTS events_owner_date_idx
  ON public.events (owner_id, event_date DESC NULLS LAST);

-- ── tags ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS tags_owner_id_idx
  ON public.tags (owner_id);
-- Note: the unique index on (owner_id, lower(name)) was created in migration 003
-- alongside the table definition and doubles as a lookup index.

-- ── event_people ──────────────────────────────────────────────
-- Lookup: all events a person attended.
CREATE INDEX IF NOT EXISTS event_people_person_id_idx
  ON public.event_people (person_id);

-- Lookup: all people at an event.
CREATE INDEX IF NOT EXISTS event_people_event_id_idx
  ON public.event_people (event_id);

CREATE INDEX IF NOT EXISTS event_people_owner_id_idx
  ON public.event_people (owner_id);

-- ── person_tags ───────────────────────────────────────────────
-- Lookup: all people with a given tag.
CREATE INDEX IF NOT EXISTS person_tags_tag_id_idx
  ON public.person_tags (tag_id);

CREATE INDEX IF NOT EXISTS person_tags_owner_id_idx
  ON public.person_tags (owner_id);

-- ── follow_ups ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS follow_ups_owner_id_idx
  ON public.follow_ups (owner_id);

-- Drives the dashboard "due/overdue" query:
--   WHERE owner_id = $1 AND status = 'pending' ORDER BY due_date
CREATE INDEX IF NOT EXISTS follow_ups_owner_status_date_idx
  ON public.follow_ups (owner_id, status, due_date);

-- Lookup: all follow-ups for a specific person.
CREATE INDEX IF NOT EXISTS follow_ups_person_id_idx
  ON public.follow_ups (person_id);
