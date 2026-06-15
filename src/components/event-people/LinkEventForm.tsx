"use client";

import { useActionState } from "react";

import { linkEvent } from "@/lib/event-people/actions";
import type { ActionState } from "@/lib/event-people/actions";

type AvailableEvent = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
};

const inputClass =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export function LinkEventForm({
  availableEvents,
  personId,
}: {
  availableEvents: AvailableEvent[];
  personId: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    linkEvent,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <input type="hidden" name="person_id" value={personId} />

      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="event_id"
        >
          Event <span className="text-red-500">*</span>
        </label>
        <select
          id="event_id"
          name="event_id"
          required
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Select an event…
          </option>
          {availableEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.event_date ? ` — ${e.event_date}` : ""}
              {e.location ? ` (${e.location})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="encounter_note"
        >
          Note{" "}
          <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="encounter_note"
          name="encounter_note"
          rows={3}
          placeholder="How you met, what you discussed…"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? "Linking…" : "Link event"}
      </button>
    </form>
  );
}
