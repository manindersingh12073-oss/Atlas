-- ─────────────────────────────────────────────────────────────
-- Migration 006: Atomic create-and-link RPC functions
--
-- Both functions run as SECURITY INVOKER (Postgres default), meaning they
-- execute as the authenticated user. auth.uid() resolves to the caller and
-- RLS applies normally to every table operation inside each function.
-- Postgres wraps the function body in an implicit transaction, so both
-- INSERTs either succeed together or roll back together.
-- CREATE OR REPLACE makes both statements idempotent.
-- ─────────────────────────────────────────────────────────────

-- Creates a new person and atomically links them to an existing event.
-- Returns the new person's id.
CREATE OR REPLACE FUNCTION public.create_person_and_link(
  p_event_id       uuid,
  p_name           text,
  p_company        text    DEFAULT NULL,
  p_role           text    DEFAULT NULL,
  p_linkedin_url   text    DEFAULT NULL,
  p_email          text    DEFAULT NULL,
  p_phone          text    DEFAULT NULL,
  p_notes          text    DEFAULT NULL,
  p_encounter_note text    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_person_id uuid;
BEGIN
  INSERT INTO public.people (owner_id, name, company, role, linkedin_url, email, phone, notes)
  VALUES (auth.uid(), p_name, p_company, p_role, p_linkedin_url, p_email, p_phone, p_notes)
  RETURNING id INTO v_person_id;

  INSERT INTO public.event_people (event_id, person_id, owner_id, encounter_note)
  VALUES (p_event_id, v_person_id, auth.uid(), p_encounter_note);

  RETURN v_person_id;
END;
$$;

-- Creates a new event and atomically links an existing person to it.
-- Returns the new event's id.
CREATE OR REPLACE FUNCTION public.create_event_and_link(
  p_person_id      uuid,
  p_name           text,
  p_event_date     date    DEFAULT NULL,
  p_location       text    DEFAULT NULL,
  p_description    text    DEFAULT NULL,
  p_encounter_note text    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO public.events (owner_id, name, event_date, location, description)
  VALUES (auth.uid(), p_name, p_event_date, p_location, p_description)
  RETURNING id INTO v_event_id;

  INSERT INTO public.event_people (event_id, person_id, owner_id, encounter_note)
  VALUES (v_event_id, p_person_id, auth.uid(), p_encounter_note);

  RETURN v_event_id;
END;
$$;
