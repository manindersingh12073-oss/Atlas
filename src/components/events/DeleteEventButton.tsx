"use client";

import { useTransition } from "react";

export function DeleteEventButton({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    startTransition(() => deleteAction());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
