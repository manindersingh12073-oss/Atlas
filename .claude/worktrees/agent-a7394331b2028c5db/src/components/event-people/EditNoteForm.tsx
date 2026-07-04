"use client";

import { useActionState } from "react";

import type { ActionState } from "@/lib/event-people/actions";

const inputClass =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export function EditNoteForm({
  action,
  defaultNote,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultNote: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="encounter_note"
        >
          Note
        </label>
        <textarea
          id="encounter_note"
          name="encounter_note"
          rows={4}
          defaultValue={defaultNote ?? ""}
          placeholder="How you met, what you discussed…"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">
          Leave blank to remove the note.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}
