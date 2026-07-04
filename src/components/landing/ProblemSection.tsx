import { ScrollReveal } from "./ScrollReveal";

const cards = [
  {
    n: "01",
    emoji: "👥",
    title: "Meet",
    body: "You meet dozens of people at every conference, meetup, and demo day.",
  },
  {
    n: "02",
    emoji: "🌫️",
    title: "Forget",
    body: "Names blur. Faces mix up. By the time you'd follow up, the context is gone.",
  },
  {
    n: "03",
    emoji: "🔁",
    title: "Reconnect",
    body: "Atlas remembers everything, so months later, you don't have to.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-gray-50 py-24 dark:bg-[#0d1117]">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto mb-14 max-w-lg text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Networking is easy. Remembering isn&apos;t.
          </h2>
          <p className="text-gray-500 dark:text-[#8b949e]">
            Your memory is brilliant. Just not after a two-day conference.
          </p>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-3">
          {cards.map((card, i) => (
            <ScrollReveal key={card.n} delay={i * 100}>
              <div className="h-full rounded-xl border border-gray-200 bg-white p-6 transition-transform duration-300 hover:-translate-y-1 dark:border-[#30363d] dark:bg-[#161b22]">
                <div className="mb-3 text-2xl">{card.emoji}</div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-[#656d76]">
                  {card.n}
                </p>
                <h3 className="mb-2 text-lg font-semibold">{card.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-[#8b949e]">
                  {card.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
