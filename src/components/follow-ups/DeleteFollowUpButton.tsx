"use client";

import { useTransition } from "react";

export function DeleteFollowUpButton({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this follow-up? This cannot be undone.")) return;
    startTransition(() => deleteAction());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
