/**
 * In-app "How to use Atlas" guide, shown in Settings. One entry per feature.
 * Rendered by src/components/settings/HowToUseAtlas.tsx as JS-free
 * <details> accordions, so keep copy plain and scannable.
 *
 * To add or edit a feature guide, change the array below — no JSX edits
 * needed. `icon` is a single emoji (no icon library). `steps` is optional:
 * include it for anything with a concrete click-by-click flow.
 */

export type GuideEntry = {
  icon: string;
  title: string;
  /** One-line summary shown under the title when the entry is expanded. */
  summary: string;
  /** Optional explanatory paragraph. */
  body?: string;
  /** Optional numbered how-to steps. */
  steps?: string[];
};

export const guide: GuideEntry[] = [
  {
    icon: "📊",
    title: "Dashboard — your home base",
    summary: "The first screen you see, built for action rather than analytics.",
    body:
      "The dashboard shows your key numbers (people, events, relationships, pending follow-ups), a global search bar, anyone you captured today, recent activity, and your follow-ups grouped into overdue, due today and upcoming. Check it at the start of each week and act on anything that's due.",
  },
  {
    icon: "⚡",
    title: "Capture / Conference Mode — add people fast",
    summary: "The fastest way to record someone you just met, without leaving the screen.",
    body:
      "Capture is built for standing at an event. Add a person and, in the same flow, attach their company, tags, an event, a follow-up reminder and who you met them with — then save and go straight to the next person.",
    steps: [
      "Open Capture from the top navigation (or from an event's page to pre-fill that event).",
      "Type the person's name and company. Atlas warns you in real time if they might already exist.",
      "Optionally add tags, link an event, pick a follow-up reminder, and note who you met them alongside.",
      "Save. The person is added instantly, and you can keep capturing or jump to their profile.",
      "Made a mistake? Use Undo on the just-captured person to remove them.",
    ],
  },
  {
    icon: "👤",
    title: "People — your contacts",
    summary: "Everyone in your network, with full profiles and history.",
    body:
      "Add people manually with Add person, or in bulk with Import from LinkedIn. Each profile holds their name, company, role, LinkedIn URL, email, phone and notes, plus their tags, relationships, events and follow-ups, and a timeline of everything you've recorded. As you type a name, Atlas flags possible duplicates so you don't add the same person twice.",
    steps: [
      "Go to People and click Add person.",
      "Fill in at least a name — everything else is optional and can be added later.",
      "Save, then open the profile any time to add tags, follow-ups, relationships or notes.",
    ],
  },
  {
    icon: "📅",
    title: "Events — where you met people",
    summary: "Conferences, meetups and dinners, with the people you met at each.",
    body:
      "Create an event with a name, date, location and description, then link the people you met there. Each event shows how many people are linked, and you can jump into Capture Mode scoped to a single event.",
    steps: [
      "Go to Events and click New event.",
      "Add the event details and save.",
      "Link people from the event page, or capture new people directly into it.",
    ],
  },
  {
    icon: "🔗",
    title: "Linking people and events",
    summary: "Connect who you met to where you met them, from either side.",
    body:
      "From a person you can link an existing event or create a new one; from an event you can link or create a person — all without losing your place. Each link can carry an encounter note (\"introduced by the organiser\", \"talked about hiring\") that you can edit later.",
  },
  {
    icon: "🏷️",
    title: "Tags — organise your way",
    summary: "Label people by context — NHS, VC, AI, founder — anything that matters to you.",
    body:
      "Tags are free-form and colour-coded. Add them on a person's profile or during capture, then filter the People page by one or more tags to instantly see just that group.",
    steps: [
      "Open a person, or the People list, and click the + next to their tags.",
      "Pick an existing tag or type a new one to create it.",
      "On the People page, use the tag filter bar to narrow the list to a tag.",
    ],
  },
  {
    icon: "🔔",
    title: "Follow-ups — never let a connection go cold",
    summary: "Reminders to reconnect, with a due date and a note.",
    body:
      "Set a follow-up on any person with a due date and an optional note. They appear on your dashboard grouped into overdue, due today and upcoming. Mark them done when you've reached out, or snooze them by 1, 7 or 30 days.",
    steps: [
      "Open a person and add a follow-up with a due date.",
      "Watch for it on the dashboard as the date approaches.",
      "Complete it once you've reconnected, or snooze it to push the date out.",
    ],
  },
  {
    icon: "🤝",
    title: "Relationships — how people know each other",
    summary: "Record connections between people, like warm intro paths.",
    body:
      "On a person's profile, record how they relate to others in your network: met together, introduced by, works with, co-founder, or friend. These connections power the network graph and help Atlas suggest warm introductions.",
  },
  {
    icon: "📥",
    title: "Import from LinkedIn",
    summary: "Bring your existing LinkedIn connections into Atlas from a CSV export.",
    body:
      "LinkedIn lets you download your connections as a CSV file. Atlas reads that file, shows you a checklist of everyone in it, flags likely duplicates, and imports only the people you tick — tagging them all \"LinkedIn Import\" so you can find them afterwards. Nothing is added until you confirm.",
    steps: [
      "In LinkedIn, go to Settings & Privacy → Data privacy → Get a copy of your data.",
      "Select \"Connections\", request the archive, and download the Connections.csv file LinkedIn emails you.",
      "In Atlas, open People and click Import from LinkedIn.",
      "Upload the CSV. Atlas parses it and shows every connection as a checklist.",
      "Anyone who looks like someone already in Atlas is marked \"Possible duplicate\" and left unticked — you can still tick them if you want them.",
      "Tick the people you want and click \"Add … to Atlas\".",
      "Find them later on the People page by filtering for the \"LinkedIn Import\" tag.",
    ],
  },
  {
    icon: "🔍",
    title: "Search & the Command Palette",
    summary: "Find anyone or anything instantly, from anywhere.",
    body:
      "Search spans your whole network — people, companies, events, tags and relationships. Use the search bar on the dashboard and People page, or press Ctrl/Cmd + K anywhere to open the Command Palette and jump straight to a person, page or action.",
    steps: [
      "Press Ctrl + K (⌘ K on Mac) to open the Command Palette.",
      "Start typing a name, company, tag or event.",
      "Use the arrow keys and Enter to open a result, or run an action like New person.",
    ],
  },
  {
    icon: "🕸️",
    title: "Insights & the Network Graph",
    summary: "See your whole network as an interactive map, plus key stats.",
    body:
      "The Insights page shows a force-directed graph of your entire network — people, companies, events and tags, and how they connect — alongside analytics cards. Zoom, pan and drag nodes, filter by type, click a node to focus on it and its connections, and double-click to open it.",
  },
  {
    icon: "✦",
    title: "Ask Atlas — your networking copilot",
    summary: "Ask questions about your network and get grounded, cited answers.",
    body:
      "Ask Atlas answers questions using what Atlas actually knows about your relationships — never made-up facts. It can draft follow-up messages, prepare a meeting brief before you see someone, and suggest who to reconnect with. Set networking goals above so its suggestions match what you're trying to achieve.",
    steps: [
      "Press Ctrl/Cmd + J, or use the Ask Atlas button in the top bar, to open it.",
      "Pick a template (like Meeting Brief or Draft follow-up) or type your own question.",
      "Look for contextual Ask Atlas buttons on person profiles, the graph and the dashboard.",
    ],
  },
  {
    icon: "📦",
    title: "Export & Restore — your data, always yours",
    summary: "Download a complete backup, and restore from one any time.",
    body:
      "Export a full copy of your network — people, events, relationships, tags and follow-ups — as a single JSON file (or a ZIP), from the Data section above. Restore replaces your current data with the contents of a backup, so use it to recover or move your account. Export regularly to keep a safe local copy.",
  },
  {
    icon: "⚙️",
    title: "Appearance",
    summary: "Make Atlas match how you like to work.",
    body:
      "Switch between light, dark and system themes in the Appearance section above. System follows your device's own dark or light setting automatically.",
  },
];
