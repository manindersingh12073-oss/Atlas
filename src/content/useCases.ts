/**
 * Case-study scenarios for the landing page. These are illustrative
 * examples of how Atlas gets used, not real customer stories — no real
 * names or companies are attached to them.
 *
 * To add a scenario, append an object to the array below. `narrative`
 * is an ordered list of short lines that build up to the payoff; keep
 * each line under ~15 words so the card reads at a glance.
 */

export type UseCase = {
  id: string;
  title: string;
  peopleMet: number;
  timeframe: string;
  narrative: string[];
  followUp: string;
};

export const useCases: UseCase[] = [
  {
    id: "startup-demo-day",
    title: "Startup Demo Day",
    peopleMet: 24,
    timeframe: "Six months later",
    narrative: [
      "You meet 24 founders, investors, and fellow builders in one afternoon.",
      "A headline mentions a startup you can't quite place.",
      "Atlas remembers: you spoke to their CTO, compared notes on infrastructure, and promised to reconnect after their raise.",
    ],
    followUp: "One message later, you're back in touch.",
  },
  {
    id: "vc-networking-event",
    title: "VC Networking Event",
    peopleMet: 18,
    timeframe: "Three months later",
    narrative: [
      "Eighteen investors in one evening — the introductions blur fast.",
      "You're raising, and timing matters.",
      "Atlas shows exactly who you met, what they invest in, and who introduced you to whom.",
    ],
    followUp: "You know precisely who to call first.",
  },
  {
    id: "medical-conference",
    title: "Medical Conference",
    peopleMet: 27,
    timeframe: "Six months later",
    narrative: [
      "You meet 27 people across two days of talks and hallway conversations.",
      "Atlas reminds you: Ali introduced you to Sarah.",
      "She now works at DeepMind. You promised to send her a paper.",
    ],
    followUp: "Follow-up due tomorrow.",
  },
  {
    id: "research-symposium",
    title: "Research Symposium",
    peopleMet: 15,
    timeframe: "A year later",
    narrative: [
      "Fifteen conversations, one poster session, zero business cards exchanged.",
      "You need a collaborator in computational biology.",
      "Atlas surfaces the postdoc you met at the coffee station — and the paper she mentioned.",
    ],
    followUp: "You reach out. She remembers you too.",
  },
];
