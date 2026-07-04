"use client";

import { useTransition } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { useDemoGuard } from "@/lib/demo/context";

export function UncompleteFollowUpButton({
  uncompleteAction,
}: {
  uncompleteAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const guard = useDemoGuard();

  return (
    <button
      type="button"
      onClick={() => guard(() => startTransition(() => uncompleteAction()))}
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
