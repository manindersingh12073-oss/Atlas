import { CtaButtonGroup } from "./SignInButton";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCta() {
  return (
    <section className="py-28 text-center">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Start remembering every conversation.
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-gray-500 dark:text-[#8b949e]">
            Join professionals who never forget the people they meet.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <CtaButtonGroup signInLabel="Start free" />
          <p className="mt-4 text-xs text-gray-400 dark:text-[#656d76]">
            Free during beta. No credit card required.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
