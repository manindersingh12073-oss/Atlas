-- ─────────────────────────────────────────────────────────────
-- Migration: atlas_memory
-- Structured, user-owned notes that back Ask Atlas (Atlas Assistant):
-- networking goals, preferences, and free-form notes. Every row is a plain
-- fact the user can see, edit, and delete in Settings — never an opaque
-- LLM memory blob. Ask Atlas only ever reads this table via a tool; writes
-- always go through the ordinary createAtlasMemory server action, triggered
-- by an explicit user click (never called directly by the model).
-- `category` is a small, growable enum so future integration-derived
-- context (e.g. company news, calendar events) can reuse this table.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.atlas_memory (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category   text        NOT NULL CHECK (category IN ('goal', 'preference', 'note')),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atlas_memory_owner_idx
  ON public.atlas_memory (owner_id, created_at DESC);

ALTER TABLE public.atlas_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_memory FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atlas_memory: select own" ON public.atlas_memory;
CREATE POLICY "atlas_memory: select own"
  ON public.atlas_memory FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "atlas_memory: insert own" ON public.atlas_memory;
CREATE POLICY "atlas_memory: insert own"
  ON public.atlas_memory FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "atlas_memory: update own" ON public.atlas_memory;
CREATE POLICY "atlas_memory: update own"
  ON public.atlas_memory FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "atlas_memory: delete own" ON public.atlas_memory;
CREATE POLICY "atlas_memory: delete own"
  ON public.atlas_memory FOR DELETE
  USING (owner_id = auth.uid());
