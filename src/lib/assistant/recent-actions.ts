// Client-side "recently used AI actions" list, persisted in localStorage.
// No DB table or dependency required — mirrors src/lib/search/recent-people.ts's
// pattern exactly. useAskAtlas.ts's sendTemplate() writes to this on every
// action; RecentAIActions reads it for the dashboard Copilot card.

export type RecentAction = {
  actionId: string;
  label: string;
  personName?: string;
};

const KEY = "atlas:recent-ai-actions";
const MAX = 5;

/** Reads the recent-actions list. Safe on the server (returns []). */
export function readRecentActions(): RecentAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentAction[]) : [];
  } catch {
    return [];
  }
}

/**
 * Records an action use: moves it to the front, dedupes by actionId+personName,
 * caps at MAX. Silently no-ops on the server or if storage is unavailable.
 */
export function recordAction(action: RecentAction): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readRecentActions().filter(
      (a) => !(a.actionId === action.actionId && a.personName === action.personName),
    );
    const next = [action, ...existing].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage disabled / quota — recent-actions is best-effort only.
  }
}
