import { comparisonIntro, with_, without } from "@/content/comparison";

import { ScrollReveal } from "./ScrollReveal";

export function ComparisonSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-12 max-w-lg text-center">
          <p className="mb-3 text-sm font-medium text-gray-400 dark:text-[#656d76]">
            {comparisonIntro}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Why Atlas?
          </h2>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2">
          <ScrollReveal>
            <div className="h-full rounded-xl border border-red-100 bg-red-50 p-7 dark:border-red-900/20 dark:bg-red-900/10">
              <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-red-400">
                Without Atlas
              </p>
              <ul className="space-y-3.5">
                {without.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-sm text-red-700 dark:text-red-400"
                  >
                    <span className="mt-0.5 shrink-0 opacity-60">✕</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="h-full rounded-xl border border-emerald-100 bg-emerald-50 p-7 dark:border-emerald-900/20 dark:bg-emerald-900/10">
              <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                With Atlas
              </p>
              <ul className="space-y-3.5">
                {with_.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-sm text-emerald-700 dark:text-emerald-400"
                  >
                    <span className="mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400">
                      ✓
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
