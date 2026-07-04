"use client";

import { useTransition } from "react";

import { Spinner } from "@/components/ui/Spinner";

export function UncompleteFollowUpButton({
  uncompleteAction,
}: {
  uncompleteAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => uncompleteAction())}
      disabled={pending}
      className="text-xs text-gray-400 hover:underline disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center gap-1">
          <Spinner className="h-3 w-3" />
          Restoring…
        </span>
      ) : (
        "Uncomplete"
      )}
    </button>
  );
}
