// Client-side "recently viewed people" list, persisted in localStorage.
// No DB table or dependency required — the dashboard search reads this for its
// empty-state "Recent People" group, and RecordPersonView writes to it when a
// person detail page is opened.

export type RecentPerson = {
  id: string;
  name: string;
  company: string | null;
};

const KEY = "atlas:recent-people";
const MAX = 5;

/** Reads the recent-viewed list. Safe on the server (returns []). */
export function readRecentPeople(): RecentPerson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentPerson[]) : [];
  } catch {
    return [];
  }
}

/**
 * Records a person view: moves them to the front, dedupes by id, caps at MAX.
 * Silently no-ops on the server or if storage is unavailable.
 */
export function recordPersonView(person: RecentPerson): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readRecentPeople().filter((p) => p.id !== person.id);
    const next = [person, ...existing].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage disabled / quota — recent-viewed is best-effort only.
  }
}
