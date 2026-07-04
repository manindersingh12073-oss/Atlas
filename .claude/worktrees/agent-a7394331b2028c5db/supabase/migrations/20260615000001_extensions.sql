-- ─────────────────────────────────────────────────────────────
-- Migration 001: Extensions and shared trigger function
-- ─────────────────────────────────────────────────────────────

-- Required for fuzzy name search (GIN trigram indexes on people.name).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Single shared function that all updated_at triggers call.
-- CREATE OR REPLACE makes this safe to re-run.
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
