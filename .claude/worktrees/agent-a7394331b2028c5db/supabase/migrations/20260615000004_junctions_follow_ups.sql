-- ─────────────────────────────────────────────────────────────
-- Migration 004: event_people, person_tags, follow_ups
-- Junction tables + follow-up reminders. Depend on migration 003.
-- ─────────────────────────────────────────────────────────────

-- ── event_people ──────────────────────────────────────────────
-- Links people to events (many-to-many). owner_id is denormalized onto the
-- junction so RLS policies are a single column check with no JOINs.
CREATE TABLE IF NOT EXISTS public.event_people (
  event_id        uuid        NOT NULL REFERENCES public.events(id)   ON DELETE CASCADE,
  person_id       uuid        NOT NULL REFERENCES public.people(id)   ON DELETE CASCADE,
  owner_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  encounter_note  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, person_id)
);

ALTER TABLE public.event_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_people FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_people: select own" ON public.event_people;
CREATE POLICY "event_people: select own"
  ON public.event_people FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "event_people: insert own" ON public.event_people;
CREATE POLICY "event_people: insert own"
  ON public.event_people FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "event_people: update own" ON public.event_people;
CREATE POLICY "event_people: update own"
  ON public.event_people FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "event_people: delete own" ON public.event_people;
CREATE POLICY "event_people: delete own"
  ON public.event_people FOR DELETE
  USING (owner_id = auth.uid());

-- ── person_tags ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.person_tags (
  person_id  uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES public.tags(id)   ON DELETE CASCADE,
  owner_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, tag_id)
);

ALTER TABLE public.person_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_tags FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "person_tags: select own" ON public.person_tags;
CREATE POLICY "person_tags: select own"
  ON public.person_tags FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "person_tags: insert own" ON public.person_tags;
CREATE POLICY "person_tags: insert own"
  ON public.person_tags FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "person_tags: update own" ON public.person_tags;
CREATE POLICY "person_tags: update own"
  ON public.person_tags FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "person_tags: delete own" ON public.person_tags;
CREATE POLICY "person_tags: delete own"
  ON public.person_tags FOR DELETE
  USING (owner_id = auth.uid());

-- ── follow_ups ────────────────────────────────────────────────
-- status is text + CHECK rather than a native enum so adding values later
-- (e.g. 'archived') requires only a CHECK constraint change, not a type migration.
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  person_id    uuid        NOT NULL REFERENCES public.people(id)   ON DELETE CASCADE,
  due_date     date        NOT NULL,
  note         text,
  status       text        NOT NULL DEFAULT 'pending'
                           CONSTRAINT follow_ups_status_check
                           CHECK (status IN ('pending', 'done', 'snoozed')),
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER set_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follow_ups: select own" ON public.follow_ups;
CREATE POLICY "follow_ups: select own"
  ON public.follow_ups FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "follow_ups: insert own" ON public.follow_ups;
CREATE POLICY "follow_ups: insert own"
  ON public.follow_ups FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "follow_ups: update own" ON public.follow_ups;
CREATE POLICY "follow_ups: update own"
  ON public.follow_ups FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "follow_ups: delete own" ON public.follow_ups;
CREATE POLICY "follow_ups: delete own"
  ON public.follow_ups FOR DELETE
  USING (owner_id = auth.uid());
