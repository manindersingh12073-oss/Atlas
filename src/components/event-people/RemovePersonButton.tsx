"use client";

import { useTransition } from "react";

import { Spinner } from "@/components/ui/Spinner";

export function RemovePersonButton({
  removeAction,
  confirmMessage = "Remove this person from the event?",
}: {
  removeAction: () => Promise<void>;
  confirmMessage?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(confirmMessage)) return;
    startTransition(() => removeAction());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center gap-1">
          <Spinner className="h-3 w-3" />
          Removing…
        </span>
      ) : (
        "Remove"
      )}
    </button>
  );
}
