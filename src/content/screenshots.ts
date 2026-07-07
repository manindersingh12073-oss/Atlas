/**
 * Single source of truth for every real Atlas screenshot used on the
 * landing page. Each `filename` is resolved under /public/marketing/ by
 * ScreenshotFrame (src/components/landing/ScreenshotFrame.tsx), which
 * renders a graceful placeholder if the file doesn't exist yet — so this
 * file can be wired up before the images are captured.
 *
 * To capture a screenshot: open Demo Mode (localhost:3000/demo), navigate
 * to the page below at ~1440px width in light mode, and save the PNG to
 * public/marketing/<filename>.
 */

export type ScreenshotSpec = {
  id: string;
  filename: string;
  alt: string;
  sourcePage: string;
};

export const screenshots: Record<string, ScreenshotSpec> = {
  personProfile: {
    id: "personProfile",
    filename: "person-profile.png",
    alt: "An Atlas person profile showing tags, events attended, relationships, and a pending follow-up",
    sourcePage: "/people/[id]",
  },
  dashboard: {
    id: "dashboard",
    filename: "dashboard.png",
    alt: "The Atlas dashboard with network stats, search, and recent activity",
    sourcePage: "/dashboard",
  },
  askAtlas: {
    id: "askAtlas",
    filename: "ask-atlas.png",
    alt: "The Atlas Copilot command palette answering a question with sourced facts and suggested actions",
    sourcePage: "Any page (Ctrl/Cmd+J)",
  },
  meetingBrief: {
    id: "meetingBrief",
    filename: "meeting-brief.png",
    alt: "A full Atlas Meeting Brief — who they are, shared history, and conversation starters",
    sourcePage: "/people/[id]",
  },
  capture: {
    id: "capture",
    filename: "capture.png",
    alt: "Atlas Conference Capture, a fast-entry flow for adding people one after another",
    sourcePage: "/capture",
  },
  networkGraph: {
    id: "networkGraph",
    filename: "network-graph.png",
    alt: "The Atlas network graph, an interactive map of people, companies, events, and tags",
    sourcePage: "/insights",
  },
  insights: {
    id: "insights",
    filename: "insights.png",
    alt: "Atlas network insights: unique companies, tags, and follow-up completion",
    sourcePage: "/insights",
  },
  search: {
    id: "search",
    filename: "search.png",
    alt: "Atlas universal search returning people, events, companies, and tags",
    sourcePage: "Command palette (⌘K) or /people?q=",
  },
};
