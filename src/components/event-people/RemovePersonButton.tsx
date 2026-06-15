"use client";

import { useTransition } from "react";

export function RemovePersonButton({
  removeAction,
}: {
  removeAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Remove this person from the event?")) return;
    startTransition(() => removeAction());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
