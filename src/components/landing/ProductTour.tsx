import { screenshots } from "@/content/screenshots";

import { ScreenshotFrame } from "./ScreenshotFrame";
import { ScrollReveal } from "./ScrollReveal";

const rows = [
  {
    screenshot: screenshots.dashboard,
    eyebrow: "Dashboard",
    headline: "Everything that needs your attention, in one place.",
    caption:
      "People, events, relationships, and follow-ups — the moment you log in, you know exactly what's next.",
  },
  {
    screenshot: screenshots.capture,
    eyebrow: "Conference Capture",
    headline: "Capture everyone before you forget.",
    caption:
      "One person, one tap, move to the next. Built for the ten minutes after an event ends, not the ten weeks after.",
  },
  {
    screenshot: screenshots.networkGraph,
    eyebrow: "Network Graph",
    headline: "See how everyone connects.",
    caption:
      "An interactive map of your whole network — people, companies, events, and the relationships between them.",
  },
  {
    screenshot: screenshots.insights,
    eyebrow: "Insights",
    headline: "Watch your network take shape.",
    caption: "Spot the patterns in who you meet, where, and how often.",
  },
  {
    screenshot: screenshots.search,
    eyebrow: "Search",
    headline: "Find anyone instantly — even years later.",
    caption:
      "Search by name, company, event, tag, or a note you jotted down once.",
  },
];

export function ProductTour() {
  return (
    <section id="product" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-16 max-w-lg text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            The real Atlas. No mockups.
          </h2>
          <p className="text-gray-500 dark:text-[#8b949e]">
            Every screen below is the actual product.
          </p>
        </ScrollReveal>

        <div className="space-y-20 sm:space-y-28">
          {rows.map((row, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={row.screenshot.id}
                className={`flex flex-col items-center gap-10 sm:gap-14 lg:flex-row ${
                  reversed ? "lg:flex-row-reverse" : ""
                }`}
              >
                <ScrollReveal as="div" className="w-full lg:w-1/2">
                  <ScreenshotFrame
                    filename={row.screenshot.filename}
                    alt={row.screenshot.alt}
                  />
                </ScrollReveal>

                <ScrollReveal
                  as="div"
                  delay={100}
                  className="w-full text-center lg:w-1/2 lg:text-left"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    {row.eyebrow}
                  </p>
                  <h3 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {row.headline}
                  </h3>
                  <p className="mx-auto max-w-md text-gray-500 lg:mx-0 dark:text-[#8b949e]">
                    {row.caption}
                  </p>
                </ScrollReveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
