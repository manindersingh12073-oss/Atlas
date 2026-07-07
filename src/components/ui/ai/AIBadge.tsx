import { AISparkleIcon } from "./AISparkleIcon";

export function AIBadge({ label = "AI" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:border-teal-800/50 dark:bg-teal-500/10 dark:text-teal-300">
      <AISparkleIcon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
