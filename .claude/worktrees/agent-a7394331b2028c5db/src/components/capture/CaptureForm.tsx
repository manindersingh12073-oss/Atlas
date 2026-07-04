"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { captureAndSave, linkExistingInCapture, undoCapture } from "@/lib/capture/actions";
import { addRelationship } from "@/lib/relationships/actions";
import { Spinner } from "@/components/ui/Spinner";
import type { RelationshipType } from "@/lib/relationships/queries";
import type { TagWithCount } from "@/lib/tags/queries";
import { CaptureCompanyInput } from "@/components/capture/CaptureCompanyInput";
import { CaptureTagSelector } from "@/components/capture/CaptureTagSelector";
import { PersonPicker } from "@/components/capture/PersonPicker";

// ── Types ─────────────────────────────────────────────────────────────────────

type DuplicatePerson = { id: string; name: string; company: string | null };
type MetPerson = { id: string; name: string; company: string | null };
type FollowUpOption = "1d" | "7d" | "30d" | null;
type EventRow = { id: string; name: string; event_date: string | null };

const FOLLOW_UP_LABELS: Record<string, string> = {
  none: "None",
  "1d": "Tomorrow",
  "7d": "+7 days",
  "30d": "+30 days",
};

const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  met_together: "Met together",
  introduced_by: "Introduced by",
  works_with: "Works with",
  co_founder: "Co-founder",
  friend: "Friend",
};

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  capturedToday: { id: string; name: string }[];
  allTags: TagWithCount[];
  recentCompanies: string[];
  allCompanies: string[];
  recentPeople: MetPerson[];
  // Event context
  events: EventRow[];
  defaultEventId: string | null;
  hideEventSelector: boolean;
  eventName?: string; // shown as context when selector is hidden
  // Relationship context — set when arriving from RelationshipPicker "+ Create new person"
  relationshipTarget?: string;      // personId of the person to link to
  relationshipType?: string;        // relationship type to create
  relationshipTargetName?: string;  // display name shown in context banner
  returnTo?: string;                // where to navigate after save in relationship context
};

// ── Component ─────────────────────────────────────────────────────────────────

export function CaptureForm({
  capturedToday,
  allTags,
  recentCompanies,
  allCompanies,
  recentPeople,
  events,
  defaultEventId,
  hideEventSelector,
  eventName,
  relationshipTarget,
  relationshipType,
  relationshipTargetName,
  returnTo,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // ── Lazy localStorage reader ─────────────────────────────────────────────
  // Called inside each lazy state initializer below — never in an effect.
  function readCapturePrefs(): {
    eventId?: string;
    followUpOption?: FollowUpOption;
    defaultTagIds?: string[];
  } | null {
    if (typeof window === "undefined") return null;
    try {
      const s = localStorage.getItem("atlas_capture_prefs");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }

  // ── Form state (localStorage initialised lazily, no effect needed) ───────
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [tagIds, setTagIds] = useState<string[]>(() => readCapturePrefs()?.defaultTagIds ?? []);
  const [eventId, setEventId] = useState<string | null>(() => {
    if (defaultEventId) return defaultEventId;
    return readCapturePrefs()?.eventId ?? null;
  });
  const [followUpOption, setFollowUpOption] = useState<FollowUpOption>(
    () => readCapturePrefs()?.followUpOption ?? null,
  );
  const [metPeople, setMetPeople] = useState<MetPerson[]>([]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [pending, setPending] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [lastCapturedId, setLastCapturedId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicatePerson[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const nameRef = useRef<HTMLInputElement>(null);
  const dupeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Focus on mount (DOM interaction — valid external system sync) ─────────
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "atlas_capture_prefs",
      JSON.stringify({ eventId, followUpOption, defaultTagIds: tagIds }),
    );
  }, [eventId, followUpOption, tagIds]);

  // ── Auto-clear success message ────────────────────────────────────────────
  useEffect(() => {
    if (!lastSaved) return;
    const t = setTimeout(() => setLastSaved(null), 3000);
    return () => clearTimeout(t);
  }, [lastSaved]);

  // ── Duplicate detection ───────────────────────────────────────────────────
  // `duplicates` is the raw async result. `visibleDuplicates` is derived:
  // when name is too short we show nothing without a synchronous setState.
  const visibleDuplicates = name.length >= 3 ? duplicates : [];

  useEffect(() => {
    clearTimeout(dupeTimerRef.current);
    if (name.length < 3) return; // visibleDuplicates is already [] when name < 3
    dupeTimerRef.current = setTimeout(async () => {
      const supabase = createClient();
      const escaped = name.replace(/%/g, "\\%").replace(/_/g, "\\_");
      const { data } = await supabase
        .from("people")
        .select("id, name, company")
        .ilike("name", `%${escaped}%`)
        .limit(3);
      setDuplicates((data ?? []) as DuplicatePerson[]);
    }, 300);
  }, [name]);

  // ── Save helpers ──────────────────────────────────────────────────────────

  function buildInput() {
    return {
      name: name.trim(),
      company: company.trim() || null,
      eventId,
      tagIds,
      followUpOption,
      metTogetherIds: metPeople.map((p) => p.id),
    };
  }

  function postSaveNext(personName: string, personId: string) {
    setLastSaved(personName);
    setLastCapturedId(personId);
    // Clear per spec — company and tags preserved
    setName("");
    setMetPeople([]);
    setDuplicates([]);
    setError(null);
    nameRef.current?.focus();
  }

  // When relationshipTarget is set, link the new/existing person to the target
  // after capture and redirect back to the originating person page.
  async function createRelationshipIfNeeded(personId: string) {
    if (!relationshipTarget || !returnTo) return;
    await addRelationship(
      relationshipTarget,
      personId,
      (relationshipType ?? "met_together") as RelationshipType,
      returnTo,
    );
  }

  async function handleSaveNext() {
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setError(null);

    const result = await captureAndSave(buildInput());
    setPending(false);

    if (result.error || !result.personId) {
      setError(result.error ?? "Failed to save.");
      return;
    }

    // Relationship context: create the relationship and return to origin page.
    if (relationshipTarget && returnTo) {
      await createRelationshipIfNeeded(result.personId);
      router.push(returnTo);
      return;
    }

    postSaveNext(result.personName!, result.personId);
  }

  async function handleSaveView() {
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setError(null);

    const result = await captureAndSave(buildInput());
    setPending(false);

    if (result.error || !result.personId) {
      setError(result.error ?? "Failed to save.");
      return;
    }

    if (relationshipTarget) {
      await createRelationshipIfNeeded(result.personId);
    }

    router.push(`/people/${result.personId}`);
  }

  async function handleUseExisting(existingId: string) {
    const existing = visibleDuplicates.find((d) => d.id === existingId);
    if (!existing || pending) return;
    setPending(true);
    setError(null);

    const result = await linkExistingInCapture({
      existingPersonId: existingId,
      eventId,
      tagIds,
      followUpOption,
      metTogetherIds: metPeople.map((p) => p.id),
    });

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Relationship context: link existing person as the relationship target too.
    if (relationshipTarget && returnTo) {
      await createRelationshipIfNeeded(existingId);
      router.push(returnTo);
      return;
    }

    postSaveNext(existing.name, existingId);
  }

  async function handleUndo() {
    if (!lastCapturedId || pending) return;
    setPending(true);
    const result = await undoCapture(lastCapturedId);
    setPending(false);
    if (!result.error) {
      setLastCapturedId(null);
      setLastSaved(null);
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  // Enter on name/company → Save & Next
  // Ctrl/Cmd+Enter → Save & View

  function handlePrimaryInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      startTransition(() => { void handleSaveView(); });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      startTransition(() => { void handleSaveNext(); });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const inputClass =
    "block w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-500 focus:outline-none";

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        {hideEventSelector && eventName ? (
          <p className="text-sm font-medium text-gray-700">{eventName}</p>
        ) : (
          <p className="text-sm font-medium text-gray-700">Conference Mode</p>
        )}
      </div>

      {/* ── Scrollable form area ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        {/* Relationship context banner */}
        {relationshipTarget && relationshipTargetName && (
          <div className="mb-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            <span className="font-medium">
              {RELATIONSHIP_TYPE_LABELS[relationshipType ?? "met_together"] ?? relationshipType}
            </span>
            {" · "}{relationshipTargetName}
            <p className="mt-0.5 text-xs text-blue-600">
              Relationship will be created automatically on save.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Name ─────────────────────────────────────────────────────── */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-gray-500" htmlFor="capture-name">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameRef}
            id="capture-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handlePrimaryInputKeyDown}
            placeholder="Full name"
            autoComplete="off"
            disabled={pending}
            className={`${inputClass} text-base disabled:opacity-50`}
          />
        </div>

        {/* ── Duplicate panel ──────────────────────────────────────────── */}
        {visibleDuplicates.length > 0 && (
          <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-xs font-medium text-amber-700">Possible existing person</p>
            {visibleDuplicates.slice(0, 1).map((d) => (
              <div key={d.id}>
                <p className="text-sm font-medium">{d.name}</p>
                {d.company && <p className="text-xs text-gray-500">{d.company}</p>}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUseExisting(d.id)}
                    disabled={pending}
                    className="rounded border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                  >
                    Use existing person
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicates([])}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Create new
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Company ──────────────────────────────────────────────────── */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">Company</label>
          <CaptureCompanyInput
            value={company}
            onChange={setCompany}
            recentCompanies={recentCompanies}
            allCompanies={allCompanies}
            onKeyDown={handlePrimaryInputKeyDown}
            disabled={pending}
          />
        </div>

        {/* ── Event selector ───────────────────────────────────────────── */}
        {!hideEventSelector && events.length > 0 && (
          <div className="mb-4 border-t border-gray-100 pt-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">Event</label>
            <select
              value={eventId ?? ""}
              onChange={(e) => setEventId(e.target.value || null)}
              className={inputClass}
            >
              <option value="">No event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Tags ─────────────────────────────────────────────────────── */}
        <div className="mb-4 border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-medium text-gray-500">Quick tags</p>
          <CaptureTagSelector
            allTags={allTags}
            selectedIds={tagIds}
            onChange={setTagIds}
          />
        </div>

        {/* ── Met together ─────────────────────────────────────────────── */}
        <div className="mb-4 border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-medium text-gray-500">Met together with</p>
          <PersonPicker
            selected={metPeople}
            onSelect={(p) => setMetPeople((prev) => [...prev, p])}
            onRemove={(id) => setMetPeople((prev) => prev.filter((p) => p.id !== id))}
            recentPeople={recentPeople}
            placeholder="Search people…"
          />
        </div>

        {/* ── Follow-up preset ─────────────────────────────────────────── */}
        <div className="mb-4 border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-medium text-gray-500">Follow-up</p>
          <div className="flex gap-2">
            {(["none", "1d", "7d", "30d"] as const).map((opt) => {
              const val = opt === "none" ? null : opt;
              const active = followUpOption === val;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFollowUpOption(val)}
                  className={`rounded border px-3 py-1.5 text-xs font-medium ${
                    active
                      ? "border-gray-700 bg-gray-800 text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {FOLLOW_UP_LABELS[opt]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Captured today ───────────────────────────────────────────── */}
        {capturedToday.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Captured today ({capturedToday.length})
            </p>
            <ul className="space-y-1">
              {capturedToday.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500 text-xs">✓</span>
                  <Link href={`/people/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
            {lastCapturedId && (
              <button
                type="button"
                onClick={handleUndo}
                disabled={pending}
                className="mt-2 text-xs text-gray-400 hover:underline disabled:opacity-50"
              >
                Undo last capture
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky footer ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white px-4 py-3 space-y-2">
        {lastSaved && (
          <p className="text-center text-sm font-medium text-green-600">
            ✓ Saved {lastSaved}
          </p>
        )}
        <button
          type="button"
          onClick={() => startTransition(() => { void handleSaveNext(); })}
          disabled={!name.trim() || pending}
          className="w-full rounded border border-gray-800 bg-gray-800 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-1.5">
              <Spinner className="h-4 w-4" />
              Saving…
            </span>
          ) : (
            relationshipTarget ? "Save & Return" : "Save & Next"
          )}
        </button>
        <button
          type="button"
          onClick={() => startTransition(() => { void handleSaveView(); })}
          disabled={!name.trim() || pending}
          className="w-full rounded border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40"
        >
          Save & View
        </button>
      </div>
    </div>
  );
}
