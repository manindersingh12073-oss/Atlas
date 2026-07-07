import { screenshots } from "@/content/screenshots";

import { CtaButtonGroup } from "./SignInButton";
import { ScreenshotFrame } from "./ScreenshotFrame";
import { ScrollReveal } from "./ScrollReveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-20 text-center">
      <div className="landing-glow" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <div className="mb-6 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-700 dark:border-teal-800/50 dark:bg-teal-500/10 dark:text-teal-300">
            The AI memory assistant for professional networking
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Never forget the people you meet.
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={160}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-[#8b949e]">
            Capture people the moment a conference ends. Remember every
            conversation. Reconnect exactly when it matters.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <div className="mt-8">
            <CtaButtonGroup signInLabel="Start free" />
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-[#656d76]">
            No account needed for the demo — explore a real network in
            seconds.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={320} className="mt-16">
          <div className="mx-auto max-w-3xl">
            <ScreenshotFrame
              filename={screenshots.personProfile.filename}
              alt={screenshots.personProfile.alt}
              priority
            />
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-[#656d76]">
            Built after forgetting far too many people at conferences.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
