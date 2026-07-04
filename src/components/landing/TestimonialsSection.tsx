import { testimonials } from "@/content/testimonials";

import { ScrollReveal } from "./ScrollReveal";

export function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-12 max-w-md text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            What people are saying
          </h2>
          <p className="text-gray-500 dark:text-[#8b949e]">
            Early users who never forget the people they meet.
          </p>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <ScrollReveal key={testimonial.name} delay={i * 90}>
              <div className="h-full rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-[#30363d] dark:bg-[#161b22]">
                <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-[#8b949e]">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-gray-400 dark:text-[#656d76]">
                    {testimonial.role} · {testimonial.company}
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
