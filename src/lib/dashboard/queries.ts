import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { getTagsWithCounts } from "@/lib/tags/queries";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DashboardStats = {
  peopleCount: number;
  eventsCount: number;
  relationshipsCount: number;
  pendingFollowUpsCount: number;
};

export type DashboardInsights = {
  uniqueCompaniesCount: number;
  totalTagsCount: number;
  completedFollowUpsCount: number;
  mostCommonTag: string | null;
  mostRepresentedCompany: string | null;
  avgPeoplePerEvent: number | null;
};

export type RecentPerson = {
  id: string;
  name: string;
  company: string | null;
  created_at: string;
};

export type DashboardData = {
  stats: DashboardStats;
  insights: DashboardInsights;
  recentPeople: RecentPerson[];
};

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all dashboard stats and insights in parallel.
 * Nine queries, all running concurrently. All computation happens in JS.
 * person_relationships uses `as any` until db:types is regenerated.
 */
export async function getDashboardData(
  supabase: SupabaseClient<Database>,
): Promise<DashboardData> {
  const [
    peopleCountResult,
    eventsCountResult,
    relCountResult,
    pendingCountResult,
    completedCountResult,
    recentPeopleResult,
    tagsWithCounts,
    companiesResult,
    eventPeopleResult,
  ] = await Promise.all([
    supabase.from("people").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    // person_relationships cast until db:types is regenerated post-migration
    (supabase as any)
      .from("person_relationships")
      .select("*", { count: "exact", head: true })
      .then((r: any) => ({ count: (r?.count ?? 0) as number }))
      .catch(() => ({ count: 0 })),
    supabase
      .from("follow_ups")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "snoozed"]),
    supabase
      .from("follow_ups")
      .select("*", { count: "exact", head: true })
      .eq("status", "done"),
    supabase
      .from("people")
      .select("id, name, company, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    getTagsWithCounts(supabase),
    supabase.from("people").select("company").not("company", "is", null),
    supabase.from("event_people").select("event_id"),
  ]);

  // ── Insight computations ───────────────────────────────────────────────────

  const companies = ((companiesResult.data ?? []) as { company: string }[]).map(
    (r) => r.company,
  );

  // Unique companies (case-insensitive)
  const uniqueCompaniesCount = new Set(companies.map((c) => c.toLowerCase()))
    .size;

  // Most represented company (most people with that company)
  const companyFreq = new Map<string, number>();
  for (const c of companies) {
    const key = c.toLowerCase();
    companyFreq.set(key, (companyFreq.get(key) ?? 0) + 1);
  }
  let mostRepresentedCompany: string | null = null;
  let maxCompanyCount = 0;
  for (const [lowerName, count] of companyFreq) {
    if (count > maxCompanyCount) {
      maxCompanyCount = count;
      // Preserve the most-frequent casing for this company name
      mostRepresentedCompany =
        companies.find((c) => c.toLowerCase() === lowerName) ?? lowerName;
    }
  }

  // Average people per event
  const eventGroups = new Map<string, number>();
  for (const row of ((eventPeopleResult.data ?? []) as { event_id: string }[])) {
    eventGroups.set(row.event_id, (eventGroups.get(row.event_id) ?? 0) + 1);
  }
  const avgPeoplePerEvent =
    eventGroups.size > 0
      ? Array.from(eventGroups.values()).reduce((a, b) => a + b, 0) /
        eventGroups.size
      : null;

  return {
    stats: {
      peopleCount: peopleCountResult.count ?? 0,
      eventsCount: eventsCountResult.count ?? 0,
      relationshipsCount: relCountResult.count,
      pendingFollowUpsCount: pendingCountResult.count ?? 0,
    },
    insights: {
      uniqueCompaniesCount,
      totalTagsCount: tagsWithCounts.length,
      completedFollowUpsCount: completedCountResult.count ?? 0,
      mostCommonTag: tagsWithCounts[0]?.name ?? null,
      mostRepresentedCompany:
        maxCompanyCount > 0 ? mostRepresentedCompany : null,
      avgPeoplePerEvent,
    },
    recentPeople: ((recentPeopleResult.data ?? []) as RecentPerson[]),
  };
}
