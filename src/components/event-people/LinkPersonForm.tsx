"use client";

import { useActionState } from "react";

import { linkPerson } from "@/lib/event-people/actions";
import type { ActionState } from "@/lib/event-people/actions";

type AvailablePerson = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
};

const inputClass =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export function LinkPersonForm({
  availablePeople,
  eventId,
}: {
  availablePeople: AvailablePerson[];
  eventId: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    linkPerson,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <input type="hidden" name="event_id" value={eventId} />

      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="person_id"
        >
          Person <span className="text-red-500">*</span>
        </label>
        <select
          id="person_id"
          name="person_id"
          required
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Select a person…
          </option>
          {availablePeople.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.role || p.company
                ? ` — ${[p.role, p.company].filter(Boolean).join(", ")}`
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="encounter_note"
        >
          Note <span className="text-xs font-normal text-gray-400">(optional)</span>
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
        {pending ? "Linking…" : "Link person"}
      </button>
    </form>
  );
}
