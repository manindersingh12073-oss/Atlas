"use client";

import { useActionState } from "react";

import type { ActionState } from "@/lib/events/actions";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    name?: string | null;
    event_date?: string | null;
    location?: string | null;
    description?: string | null;
  };
  submitLabel?: string;
};

const inputClass =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export function EventForm({
  action,
  defaultValues,
  submitLabel = "Save",
}: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="name">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="event_date">
          Date
        </label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          defaultValue={defaultValues?.event_date ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="location">
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={defaultValues?.location ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
