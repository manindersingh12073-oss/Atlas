"use client";

import { useTransition } from "react";

import { useDemoGuard } from "@/lib/demo/context";

export function RemoveRelationshipButton({
  removeAction,
}: {
  removeAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const guard = useDemoGuard();

  return (
    <button
      type="button"
      onClick={() => guard(() => startTransition(() => removeAction()))}
      disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
