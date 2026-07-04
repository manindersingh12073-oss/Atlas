import Link from "next/link";

/**
 * Consistent empty state used across all list pages and sections.
 * Shows an icon, title, optional description, and optional primary action.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center ${compact ? "py-8" : "py-14"}`}
    >
      <span
        className={`mb-3 ${compact ? "text-2xl" : "text-4xl"} text-gray-200 dark:text-[#30363d]`}
        aria-hidden
      >
        {icon}
      </span>
      <p className="text-sm font-medium text-gray-700 dark:text-[#cdd5de]">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500 dark:text-[#8b949e]">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-[#30363d] dark:text-[#cdd5de] dark:hover:bg-[#1c2230]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
