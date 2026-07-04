import { useCases } from "@/content/useCases";

import { ScrollReveal } from "./ScrollReveal";

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-14 max-w-lg text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Real conversations. Months later.
          </h2>
          <p className="text-gray-500 dark:text-[#8b949e]">
            Illustrative scenarios — the kind of moment Atlas is built for.
          </p>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {useCases.map((useCase, i) => (
            <ScrollReveal key={useCase.id} delay={i * 80}>
              <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 transition-transform duration-300 hover:-translate-y-1 dark:border-[#30363d] dark:bg-[#161b22]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{useCase.title}</h3>
                  <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-[#8b949e]">
                    {useCase.peopleMet} people met
                  </span>
                </div>

                <ul className="mb-4 flex-1 space-y-2">
                  {useCase.narrative.map((line) => (
                    <li
                      key={line}
                      className="text-sm leading-relaxed text-gray-500 dark:text-[#8b949e]"
                    >
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 dark:border-amber-900/20 dark:bg-amber-900/10">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                    {useCase.timeframe}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-500">
                    {useCase.followUp}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
