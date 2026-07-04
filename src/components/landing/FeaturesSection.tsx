import { features } from "@/content/features";

import { ScrollReveal } from "./ScrollReveal";

export function FeaturesSection() {
  return (
    <section className="bg-gray-50 py-24 dark:bg-[#0d1117]">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-12 max-w-lg text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything else your network needs.
          </h2>
          <p className="text-gray-500 dark:text-[#8b949e]">
            The supporting cast to conversations you&apos;d otherwise lose
            track of.
          </p>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={(i % 3) * 80}>
              <div className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-transform duration-300 hover:-translate-y-1 dark:border-[#30363d] dark:bg-[#161b22]">
                <div className="mb-3 text-xl">{feature.icon}</div>
                <h3 className="mb-1.5 text-sm font-semibold">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-[#8b949e]">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
