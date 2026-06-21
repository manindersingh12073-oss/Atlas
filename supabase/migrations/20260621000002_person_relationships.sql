-- ─────────────────────────────────────────────────────────────
-- Migration: person_relationships
-- Stores person-to-person relationships.
-- One row per relationship pair — symmetric display is handled in application code.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.person_relationships (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  person_a   uuid        NOT NULL REFERENCES public.people(id)   ON DELETE CASCADE,
  person_b   uuid        NOT NULL REFERENCES public.people(id)   ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN (
               'met_together',
               'introduced_by',
               'works_with',
               'co_founder',
               'friend'
             )),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT person_relationships_no_self CHECK (person_a <> person_b)
);

-- Prevent duplicate relationships regardless of which person is person_a vs person_b.
-- LEAST/GREATEST on text cast ensures canonical ordering for the unique check.
CREATE UNIQUE INDEX IF NOT EXISTS person_relationships_dedup
  ON public.person_relationships (
    owner_id,
    LEAST(person_a::text, person_b::text),
    GREATEST(person_a::text, person_b::text),
    type
  );

-- Indexes for person-page queries (WHERE person_a = X OR person_b = X).
CREATE INDEX IF NOT EXISTS person_relationships_a_idx
  ON public.person_relationships (owner_id, person_a);

CREATE INDEX IF NOT EXISTS person_relationships_b_idx
  ON public.person_relationships (owner_id, person_b);

ALTER TABLE public.person_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_relationships FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "person_relationships: select own" ON public.person_relationships;
CREATE POLICY "person_relationships: select own"
  ON public.person_relationships FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "person_relationships: insert own" ON public.person_relationships;
CREATE POLICY "person_relationships: insert own"
  ON public.person_relationships FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "person_relationships: update own" ON public.person_relationships;
CREATE POLICY "person_relationships: update own"
  ON public.person_relationships FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "person_relationships: delete own" ON public.person_relationships;
CREATE POLICY "person_relationships: delete own"
  ON public.person_relationships FOR DELETE
  USING (owner_id = auth.uid());
