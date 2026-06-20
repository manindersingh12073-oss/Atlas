"use client";

import { useTransition } from "react";

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
      {pending ? "Completing…" : "Complete"}
    </button>
  );
}
