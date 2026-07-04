import { workflowSteps } from "@/content/workflow";

import { ScrollReveal } from "./ScrollReveal";

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-24 dark:bg-[#0d1117]">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-16 max-w-md text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Conference workflow
          </h2>
          <p className="text-gray-500 dark:text-[#8b949e]">
            From first handshake to lasting relationship.
          </p>
        </ScrollReveal>

        <div className="mx-auto max-w-2xl">
          {workflowSteps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 90}>
              <div className="relative flex gap-6 pb-10 last:pb-0">
                {i < workflowSteps.length - 1 && (
                  <div className="absolute left-[15px] top-9 h-full w-px bg-gray-100 dark:bg-[#30363d]" />
                )}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-xs font-semibold text-blue-600 dark:bg-[#0f1117]">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-[#8b949e]">
                    {step.description}
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
