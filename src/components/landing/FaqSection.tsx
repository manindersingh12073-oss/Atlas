import { faqs } from "@/content/faqs";

import { ScrollReveal } from "./ScrollReveal";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-gray-100 dark:border-[#30363d]">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
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
      <p className="pb-4 text-sm leading-relaxed text-gray-600 dark:text-[#8b949e]">
        {answer}
      </p>
    </details>
  );
}

export function FaqSection() {
  return (
    <section className="bg-gray-50 py-24 dark:bg-[#0d1117]">
      <div className="mx-auto max-w-2xl px-6">
        <ScrollReveal>
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          {faqs.map((faq) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
