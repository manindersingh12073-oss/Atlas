"use client";

import { useTransition } from "react";

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
      {pending ? "…" : "Uncomplete"}
    </button>
  );
}
