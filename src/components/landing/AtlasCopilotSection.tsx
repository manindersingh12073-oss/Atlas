import { copilotFeatures } from "@/content/copilot";
import { AIBadge } from "@/components/ui/ai/AIBadge";
import { AISparkleIcon } from "@/components/ui/ai/AISparkleIcon";

import { ScrollReveal } from "./ScrollReveal";

/**
 * A dedicated marketing section for Atlas Copilot — not just another card
 * in the secondary features grid. Establishes the AI narrative early in the
 * page (right after ProblemSection, before the ProductTour), reusing the
 * same teal AI design language as the in-app Copilot surfaces.
 */
export function AtlasCopilotSection() {
  return (
    <section className="bg-teal-50/40 py-24 dark:bg-teal-500/[0.03]">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 flex justify-center">
            <AIBadge label="Atlas Copilot" />
          </div>
          <h2 className="mb-4 flex items-center justify-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            <AISparkleIcon className="h-7 w-7 text-teal-500" />
            Meet Atlas Copilot.
          </h2>
          <p className="text-gray-500 dark:text-[#8b949e]">
            The AI that already knows your network — ask it anything, and it answers from what you&apos;ve actually recorded.
          </p>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copilotFeatures.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={(i % 4) * 80}>
              <div className="h-full rounded-xl border border-teal-100 bg-white p-5 transition-transform duration-300 hover:-translate-y-1 dark:border-teal-900/40 dark:bg-[#161b22]">
                <div className="mb-3 text-xl">{feature.icon}</div>
                <h3 className="mb-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-[#8b949e]">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
