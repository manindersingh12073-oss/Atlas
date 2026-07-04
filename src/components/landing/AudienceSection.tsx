import { audience } from "@/content/audience";

import { ScrollReveal } from "./ScrollReveal";

export function AudienceSection() {
  return (
    <section className="bg-gray-50 py-24 dark:bg-[#0d1117]">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <ScrollReveal>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for people who meet people.
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-gray-500 dark:text-[#8b949e]">
            Wherever your work takes you, Atlas keeps your network with you.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="flex flex-wrap justify-center gap-2.5">
            {audience.map((role) => (
              <span
                key={role}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3]"
              >
                {role}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
