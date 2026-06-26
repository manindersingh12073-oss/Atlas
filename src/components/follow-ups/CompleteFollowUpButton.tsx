"use client";

import { useTransition } from "react";

import { Spinner } from "@/components/ui/Spinner";

export function CompleteFollowUpButton({
  completeAction,
}: {
  completeAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => completeAction())}
      disabled={pending}
      className="text-xs text-green-600 hover:underline disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center gap-1">
          <Spinner className="h-3 w-3" />
          Completing…
        </span>
      ) : (
        "Complete"
      )}
    </button>
  );
}
