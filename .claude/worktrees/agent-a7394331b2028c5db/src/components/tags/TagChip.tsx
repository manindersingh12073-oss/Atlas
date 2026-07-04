"use client";

import { useTransition } from "react";

import type { Tag } from "@/lib/tags/queries";

// Full class strings required so Tailwind's scanner includes them at build time.
const STYLES: Record<string, { chip: string; text: string }> = {
  blue:   { chip: "bg-blue-100 border-blue-200",     text: "text-blue-700" },
  green:  { chip: "bg-green-100 border-green-200",   text: "text-green-700" },
  purple: { chip: "bg-purple-100 border-purple-200", text: "text-purple-700" },
  orange: { chip: "bg-orange-100 border-orange-200", text: "text-orange-700" },
  pink:   { chip: "bg-pink-100 border-pink-200",     text: "text-pink-700" },
  teal:   { chip: "bg-teal-100 border-teal-200",     text: "text-teal-700" },
  indigo: { chip: "bg-indigo-100 border-indigo-200", text: "text-indigo-700" },
  rose:   { chip: "bg-rose-100 border-rose-200",     text: "text-rose-700" },
};

function getStyle(color: string) {
  return STYLES[color] ?? STYLES.blue;
}

export function TagChip({
  tag,
  onRemove,
}: {
  tag: Tag;
  onRemove?: () => Promise<void>;
}) {
  const [removing, startTransition] = useTransition();
  const style = getStyle(tag.color);

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded border px-2 py-0.5 text-xs font-medium ${style.chip} ${style.text} ${removing ? "opacity-40" : ""}`}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={() => startTransition(() => onRemove())}
          disabled={removing}
          className="ml-0.5 leading-none opacity-50 hover:opacity-100 disabled:cursor-not-allowed"
          aria-label={`Remove ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
