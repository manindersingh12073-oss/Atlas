import Link from "next/link";

import { demoDataset } from "@/lib/demo/dataset";

import { CountUpStat } from "./CountUpStat";
import { ScrollReveal } from "./ScrollReveal";

// Prominent, dedicated callout for Demo Mode. Stat counts are read straight
// from the shipped demo dataset (src/lib/demo/dataset.ts) — the same numbers
// a visitor will actually see once they click through — never invented.
export function DemoSpotlight() {
  const stats = [
    { value: demoDataset.people.length, label: "people to explore" },
    { value: demoDataset.events.length, label: "events" },
    { value: demoDataset.relationships.length, label: "relationships mapped" },
  ];

  return (
    <section className="border-y border-gray-100 bg-gray-50 py-24 dark:border-[#30363d] dark:bg-[#0d1117]">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Try before you sign up.
          </h2>
          <p className="mx-auto mb-12 max-w-md text-gray-500 dark:text-[#8b949e]">
            Explore a full, realistic Atlas network — no account required.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="mb-12 grid grid-cols-3 gap-6">
            {stats.map((stat) => (
              <CountUpStat
                key={stat.label}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2.5 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-700 hover:shadow-md dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Try Demo
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
