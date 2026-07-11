/**
 * In-app "how do I…" FAQ, shown in Settings and focused on using Atlas
 * (distinct from src/content/faqs.ts, which is the marketing FAQ on the
 * landing page). Rendered by src/components/settings/HelpFaq.tsx as JS-free
 * <details> accordions.
 *
 * To add a question, append an object below — no JSX edits needed.
 */

export type HelpFaq = {
  question: string;
  answer: string;
};

export const helpFaqs: HelpFaq[] = [
  {
    question: "How do I add someone I just met?",
    answer:
      "Use Capture. It's the fastest way to add a person — open it from the top navigation, type their name and company, optionally add tags, an event and a follow-up, then save. You can also use Add person on the People page for a fuller form.",
  },
  {
    question: "What's the fastest way to add lots of people at a conference?",
    answer:
      "Open Capture (ideally from the event's page so it's pre-linked), and add people one after another — each save clears the form for the next person, so you never leave the screen. Set a follow-up as you go so nobody slips through the cracks.",
  },
  {
    question: "How do I import my LinkedIn connections?",
    answer:
      "In LinkedIn, go to Settings & Privacy → Data privacy → Get a copy of your data, choose Connections, and download the Connections.csv file. In Atlas, open People → Import from LinkedIn, upload the file, tick the people you want (duplicates are flagged and left unticked), and confirm. Everyone imported is tagged “LinkedIn Import” so you can find them later.",
  },
  {
    question: "How do I set a reminder to follow up with someone?",
    answer:
      "Open the person's profile and add a follow-up with a due date and an optional note. It'll show up on your dashboard under overdue, due today or upcoming. Mark it done once you've reached out, or snooze it by 1, 7 or 30 days.",
  },
  {
    question: "How do I organise people into groups?",
    answer:
      "Use tags. Add them on a person's profile or during capture — for example NHS, VC, AI or founder — then filter the People page by one or more tags to see just that group.",
  },
  {
    question: "How do I record how two people know each other?",
    answer:
      "On a person's profile, add a relationship to another person and choose the type: met together, introduced by, works with, co-founder or friend. These connections also show up in the network graph.",
  },
  {
    question: "How do I find someone quickly?",
    answer:
      "Press Ctrl + K (⌘ K on Mac) anywhere to open the Command Palette, then type a name, company, tag or event. You can also use the search bar on the dashboard and People page. Search covers people, companies, events, tags and relationships.",
  },
  {
    question: "What is Ask Atlas and how do I use it?",
    answer:
      "Ask Atlas is a copilot that answers questions about your network using only what Atlas actually knows — it can draft follow-up messages, prepare meeting briefs and suggest who to reconnect with. Open it with Ctrl/Cmd + J or the Ask Atlas button in the top bar. Set your networking goals in Settings so its suggestions fit what you're working towards.",
  },
  {
    question: "How do I see my whole network visually?",
    answer:
      "Open Insights. It shows an interactive graph of everyone in your network and how they connect, plus summary stats. Drag nodes around, filter by type, click a node to focus on its connections, and double-click to open it.",
  },
  {
    question: "How do I back up or export my data?",
    answer:
      "In Settings → Data, click Export to download a complete copy of your network as a JSON (or ZIP) file. Nothing is deleted when you export. To restore, use Restore in the same section — note that restoring replaces your current data with the backup's contents.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. Atlas is single-user and private by design — your network is only visible to you, and it's never sold or shared. You can export everything at any time.",
  },
  {
    question: "Can I use Atlas on my phone?",
    answer:
      "Yes. Atlas is fully responsive, so you can capture people and check follow-ups from your phone — ideally before you've even left the venue.",
  },
];
