/**
 * Landing page FAQ. To add a question, append an object to the array below.
 * Rendered as native <details>/<summary> — no JS required.
 */

export type Faq = {
  question: string;
  answer: string;
};

export const faqs: Faq[] = [
  {
    question: "Why not just use LinkedIn?",
    answer:
      "LinkedIn is a public directory, optimised for your professional image. Atlas is a private memory layer, optimised for your relationships — the context, the notes, how you actually met, who introduced you. LinkedIn was never built to hold any of that.",
  },
  {
    question: "Does Atlas own my contacts?",
    answer:
      "No. Your network is yours. Atlas never sells or shares your data, and you can export everything — every person, event, and relationship — at any time.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes, in full. One JSON backup of your entire network — people, events, relationships, tags, and follow-ups — on demand. No vendor lock-in.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes. Atlas is fully responsive, so you can capture people on your phone before you've even left the venue.",
  },
  {
    question: "Can I use it during a conference, not just after?",
    answer:
      "That's exactly what it's built for. Conference Capture is a fast-entry flow — add someone, save, move straight to the next person, without leaving the screen.",
  },
  {
    question: "Is Atlas free?",
    answer:
      "Free during the beta. Pricing will be announced before public launch.",
  },
];
