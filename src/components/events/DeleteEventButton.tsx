"use client";

import { useTransition } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { useDemoGuard } from "@/lib/demo/context";

export function DeleteEventButton({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const guard = useDemoGuard();

  function handleClick() {
    guard(() => {
      if (!confirm("Delete this event? This cannot be undone.")) return;
      startTransition(() => deleteAction());
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center gap-1.5">
          <Spinner className="h-3 w-3" />
          Deleting…
        </span>
      ) : (
        "Delete"
      )}
    </button>
  );
}
