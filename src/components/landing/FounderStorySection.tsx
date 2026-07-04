import { founderStory } from "@/content/founderStory";

import { ScrollReveal } from "./ScrollReveal";

export function FounderStorySection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <ScrollReveal>
          <h2 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
            {founderStory.heading}
          </h2>
          <div className="space-y-4 text-left">
            {founderStory.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-base leading-relaxed text-gray-500 dark:text-[#8b949e]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
