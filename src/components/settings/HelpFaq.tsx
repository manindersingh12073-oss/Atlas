import { helpFaqs } from "@/content/helpFaqs";

/**
 * In-app "how do I…" FAQ in Settings, driven by src/content/helpFaqs.ts.
 * Native <details> accordions — no client JS.
 */
export function HelpFaq() {
  return (
    <div className="divide-y divide-gray-100 rounded border border-gray-200 dark:divide-[#30363d] dark:border-[#30363d]">
      {helpFaqs.map((faq) => (
        <details key={faq.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span>{faq.question}</span>
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
          <p className="px-4 pb-4 text-sm leading-relaxed text-gray-500">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
