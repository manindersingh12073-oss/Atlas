import { guide } from "@/content/guide";

/**
 * The "How to use Atlas" guide in Settings — one collapsible entry per
 * feature, driven by src/content/guide.ts. Uses native <details> so it needs
 * no client JS (same approach as the landing-page FAQ).
 */
export function HowToUseAtlas() {
  return (
    <div className="divide-y divide-gray-100 rounded border border-gray-200 dark:divide-[#30363d] dark:border-[#30363d]">
      {guide.map((entry) => (
        <details key={entry.title} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="text-base" aria-hidden>
                {entry.icon}
              </span>
              <span className="text-sm font-medium">{entry.title}</span>
            </span>
            <svg
              className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div className="px-4 pb-4 pl-11">
            <p className="text-sm font-medium text-gray-600 dark:text-[#c9d1d9]">
              {entry.summary}
            </p>
            {entry.body && (
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {entry.body}
              </p>
            )}
            {entry.steps && entry.steps.length > 0 && (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-gray-600 dark:text-[#c9d1d9]">
                {entry.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
