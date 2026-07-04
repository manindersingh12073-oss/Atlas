"use client";

import { useActionState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import type { ActionState } from "@/lib/follow-ups/actions";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    due_date?: string | null;
    note?: string | null;
  };
  submitLabel?: string;
};

const inputClass =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export function FollowUpForm({
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
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="due_date"
        >
          Due date <span className="text-red-500">*</span>
        </label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          required
          defaultValue={defaultValues?.due_date ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="note"
        >
          Note
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          defaultValue={defaultValues?.note ?? ""}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? (
          <span className="flex items-center gap-1.5">
            <Spinner className="h-3 w-3" />
            Saving…
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
