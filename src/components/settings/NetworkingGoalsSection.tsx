"use client";

import { useActionState, useTransition } from "react";

import { createAtlasMemory, deleteAtlasMemory } from "@/lib/atlas-memory/actions";
import type { AtlasMemoryEntry } from "@/lib/atlas-memory/queries";

function DeleteGoalButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteAtlasMemory(id))}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

/**
 * Atlas Memory, made concrete: every networking goal Ask Atlas can factor
 * into its suggestions is a plain row here — visible, addable, and
 * removable. This transparency is the explainability guarantee for any
 * goal-driven suggestion Ask Atlas makes elsewhere in the app.
 */
export function NetworkingGoalsSection({ goals }: { goals: AtlasMemoryEntry[] }) {
  const [state, formAction, pending] = useActionState(createAtlasMemory, { error: null });

  return (
    <div>
      <p className="mb-1 text-base font-medium">Networking goals</p>
      <p className="mb-4 text-sm text-gray-500">
        Ask Atlas weighs its suggestions toward these goals and cites them by name when it does.
        These are the only durable notes Ask Atlas remembers between conversations — nothing else
        is stored.
      </p>

      {goals.length > 0 && (
        <ul className="mb-4 divide-y divide-gray-100 rounded border border-gray-200 dark:divide-[#30363d] dark:border-[#30363d]">
          {goals.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="text-sm">{g.content}</span>
              <DeleteGoalButton id={g.id} />
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="category" value="goal" />
        <input
          type="text"
          name="content"
          placeholder="e.g. Meet more healthcare investors this quarter"
          required
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none dark:border-[#3d444e] dark:bg-[#161b22]"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-[#3d444e] dark:hover:bg-[#1c2230]"
        >
          {pending ? "Adding…" : "Add goal"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
