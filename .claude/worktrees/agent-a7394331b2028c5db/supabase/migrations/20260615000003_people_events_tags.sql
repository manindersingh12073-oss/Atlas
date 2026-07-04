-- ─────────────────────────────────────────────────────────────
-- Migration 003: people, events, tags
-- These three tables depend only on profiles and are independent of each other.
-- ─────────────────────────────────────────────────────────────

-- ── people ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.people (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  company        text,
  role           text,
  linkedin_url   text,
  email          text,
  phone          text,
  notes          text,
  -- Generated column: maintained automatically by Postgres when any source column changes.
  -- Covers name, company, role, and notes for full-text search.
  search_vector  tsvector    GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name,    '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(role,    '') || ' ' ||
      coalesce(notes,   '')
    )
  ) STORED,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_people_updated_at ON public.people;
CREATE TRIGGER set_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "people: select own" ON public.people;
CREATE POLICY "people: select own"
  ON public.people FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "people: insert own" ON public.people;
CREATE POLICY "people: insert own"
  ON public.people FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "people: update own" ON public.people;
CREATE POLICY "people: update own"
  ON public.people FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "people: delete own" ON public.people;
CREATE POLICY "people: delete own"
  ON public.people FOR DELETE
  USING (owner_id = auth.uid());

-- ── events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  event_date   date,
  location     text,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events: select own" ON public.events;
CREATE POLICY "events: select own"
  ON public.events FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "events: insert own" ON public.events;
CREATE POLICY "events: insert own"
  ON public.events FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "events: update own" ON public.events;
CREATE POLICY "events: update own"
  ON public.events FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "events: delete own" ON public.events;
CREATE POLICY "events: delete own"
  ON public.events FOR DELETE
  USING (owner_id = auth.uid());

-- ── tags ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now()
  -- No updated_at: tags are simple label rows; the name/color can be replaced.
);

-- Case-insensitive uniqueness: user cannot have two tags named "Investor" and "investor".
CREATE UNIQUE INDEX IF NOT EXISTS tags_owner_name_unique
  ON public.tags (owner_id, lower(name));

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags: select own" ON public.tags;
CREATE POLICY "tags: select own"
  ON public.tags FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "tags: insert own" ON public.tags;
CREATE POLICY "tags: insert own"
  ON public.tags FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "tags: update own" ON public.tags;
CREATE POLICY "tags: update own"
  ON public.tags FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "tags: delete own" ON public.tags;
CREATE POLICY "tags: delete own"
  ON public.tags FOR DELETE
  USING (owner_id = auth.uid());
