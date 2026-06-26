import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/ui/EmptyState";

import { PeopleSearchInput } from "@/components/people/PeopleSearchInput";
import { SortSelect } from "@/components/SortSelect";
import { TagChip } from "@/components/tags/TagChip";
import { TagFilterBar } from "@/components/tags/TagFilterBar";
import { TagPicker } from "@/components/tags/TagPicker";
import { removeTagFromPerson } from "@/lib/tags/actions";
import { getPersonTagsMap, getTagsWithCounts } from "@/lib/tags/queries";
import {
  DEFAULT_PEOPLE_SORT,
  PEOPLE_SORT_OPTIONS,
  getPersonEventData,
  parsePeopleSort,
  searchPeople,
} from "@/lib/people/queries";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ q?: string; sort?: string; tags?: string }>;
};

export default async function PeoplePage({ searchParams }: Props) {
  const { q, sort: sortParam, tags: tagsParam } = await searchParams;
  const query = q?.trim() ?? "";
  const sort = parsePeopleSort(sortParam);
  const hasQuery = query.length > 0;
  const selectedTagIds = tagsParam
    ? tagsParam.split(",").filter(Boolean)
    : [];

  const supabase = await createClient();

  const [people, eventDataMap, allTagsWithCounts, personTagsMap] =
    await Promise.all([
      searchPeople(supabase, query, sort),
      getPersonEventData(supabase),
      getTagsWithCounts(supabase),
      getPersonTagsMap(supabase),
    ]);

  // "Most events" sort applied in JS after joining counts.
  let displayPeople =
    !hasQuery && sort === "events_desc"
      ? [...people].sort((a, b) => {
          const ca = eventDataMap.get(a.id)?.event_count ?? 0;
          const cb = eventDataMap.get(b.id)?.event_count ?? 0;
          return cb - ca;
        })
      : people;

  // AND tag filter: keep only people who have every selected tag.
  if (selectedTagIds.length > 0) {
    displayPeople = displayPeople.filter((p) => {
      const personTagIds = new Set(
        (personTagsMap.get(p.id) ?? []).map((t) => t.id),
      );
      return selectedTagIds.every((id) => personTagIds.has(id));
    });
  }

  const hasTagFilter = selectedTagIds.length > 0;

  // "Clear search" preserves the active tag filter.
  const clearSearchHref =
    hasTagFilter ? `/people?tags=${selectedTagIds.join(",")}` : "/people";

  return (
    <main className="mx-auto max-w-[62rem] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">People</h1>
        <Link
          href="/people/new"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Add person
        </Link>
      </div>

      <div className="mb-6 space-y-2">
        {/* Search + sort row */}
        <div className="flex items-center gap-2">
          <form method="GET" action="/people" className="flex-1">
            <PeopleSearchInput defaultValue={query} currentSort={sort} />
          </form>
          <Suspense
            fallback={
              <select
                disabled
                className="cursor-not-allowed rounded border border-gray-300 px-2 py-1.5 text-sm opacity-50"
              >
                <option>
                  {PEOPLE_SORT_OPTIONS.find((o) => o.value === sort)?.label}
                </option>
              </select>
            }
          >
            <SortSelect
              options={PEOPLE_SORT_OPTIONS}
              value={hasQuery ? DEFAULT_PEOPLE_SORT : sort}
              disabled={hasQuery}
            />
          </Suspense>
        </div>

        {/* Tag filter bar */}
        {allTagsWithCounts.length > 0 && (
          <TagFilterBar
            allTags={allTagsWithCounts}
            selectedTagIds={selectedTagIds}
            pathname="/people"
            currentQ={query}
            currentSort={sort}
          />
        )}

        {/* Active filter summary */}
        {(hasQuery || hasTagFilter) && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {displayPeople.length}{" "}
              {displayPeople.length === 1 ? "result" : "results"}
              {hasQuery && (
                <>
                  {" "}for{" "}
                  <span className="font-medium">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </p>
            {hasQuery && (
              <Link
                href={clearSearchHref}
                className="text-xs text-gray-500 hover:underline"
              >
                Clear search
              </Link>
            )}
          </div>
        )}
      </div>

      {displayPeople.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded border border-gray-200">
          {displayPeople.map((person) => {
            const ed = eventDataMap.get(person.id);
            const personTags = personTagsMap.get(person.id) ?? [];
            return (
              <li key={person.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1c2230]">
                {/* Top row: person info + arrow */}
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/people/${person.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-sm font-medium">{person.name}</p>
                    {(person.company || person.role) && (
                      <p className="text-xs text-gray-500">
                        {[person.role, person.company]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {ed && ed.event_count > 0 && (
                      <p className="text-xs text-gray-400">
                        {ed.event_count}{" "}
                        {ed.event_count === 1 ? "event" : "events"}
                        {ed.recent_events.length > 0 &&
                          " · " +
                            ed.recent_events.map((e) => e.name).join(", ")}
                      </p>
                    )}
                  </Link>
                  <Link
                    href={`/people/${person.id}`}
                    className="shrink-0 text-sm text-gray-400"
                    tabIndex={-1}
                    aria-hidden
                  >
                    →
                  </Link>
                </div>

                {/* Tag row */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {personTags.map((tag) => (
                    <TagChip
                      key={tag.id}
                      tag={tag}
                      onRemove={removeTagFromPerson.bind(
                        null,
                        person.id,
                        tag.id,
                      )}
                    />
                  ))}
                  <TagPicker
                    personId={person.id}
                    allTags={allTagsWithCounts}
                    personTagIds={personTags.map((t) => t.id)}
                    triggerLabel="+"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : hasQuery || hasTagFilter ? (
        <div>
          <EmptyState
            icon="🔍"
            title={hasQuery ? `No results for "${query}"` : "No people match the selected tags"}
            description={
              hasQuery
                ? "Try different keywords, or add this person to your network."
                : "Try adjusting your tag filters."
            }
            action={
              hasQuery
                ? { label: `Add "${query}"`, href: `/people/new?name=${encodeURIComponent(query)}` }
                : undefined
            }
          />
          {hasQuery && (
            <div className="mt-2 text-center">
              <Link href={clearSearchHref} className="text-xs text-gray-500 hover:underline">
                Clear search
              </Link>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon="👤"
          title="No people yet"
          description="Start building your network. Add people you meet at events, online, or anywhere else."
          action={{ label: "Add your first person", href: "/people/new" }}
        />
      )}
    </main>
  );
}
