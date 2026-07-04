"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import type { SearchSuggestions } from "@/lib/search/queries";
import {
  companyItem,
  eventItem,
  flattenUnique,
  personItem,
  relationshipItem,
  tagItem,
  type Item,
  type Section,
} from "./items";
import { SearchResultsList } from "./SearchResultsList";
import { useListNav } from "./useListNav";
import { useNetworkSearch } from "./useNetworkSearch";

/**
 * The primary inline search bar, used on both the dashboard and the People
 * page. Wraps the shared universal-search hooks in a prominent input with a
 * grouped results dropdown, empty-state suggestions, and keyboard navigation.
 */
export function UniversalSearchBar({
  suggestions,
  autoFocus = false,
}: {
  suggestions: SearchSuggestions;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const {
    query,
    trimmed,
    hasQuery,
    results,
    loading,
    recentPeople,
    onQueryChange,
    refreshRecent,
  } = useNetworkSearch();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ── Build grouped sections ────────────────────────────────────────────────
  const sections = useMemo<Section[]>(() => {
    if (!hasQuery) {
      const out: Section[] = [];
      if (recentPeople.length > 0)
        out.push({
          heading: "Recently viewed",
          items: recentPeople.slice(0, 5).map(personItem),
        });
      if (suggestions.recentEvents.length > 0)
        out.push({
          heading: "Recent Events",
          items: suggestions.recentEvents.map(eventItem),
        });
      if (suggestions.topCompanies.length > 0)
        out.push({
          heading: "Popular Companies",
          items: suggestions.topCompanies.map(companyItem),
        });
      if (suggestions.popularTags.length > 0)
        out.push({
          heading: "Popular Tags",
          items: suggestions.popularTags.map(tagItem),
        });
      return out;
    }

    if (!results) return [];
    const out: Section[] = [];
    if (results.people.length > 0)
      out.push({ heading: "People", items: results.people.map(personItem) });
    if (results.events.length > 0)
      out.push({ heading: "Events", items: results.events.map(eventItem) });
    if (results.companies.length > 0)
      out.push({ heading: "Companies", items: results.companies.map(companyItem) });
    if (results.tags.length > 0)
      out.push({ heading: "Tags", items: results.tags.map(tagItem) });
    if (results.relationships.length > 0)
      out.push({
        heading: "Relationships",
        items: results.relationships.map(relationshipItem),
      });
    return out;
  }, [hasQuery, results, recentPeople, suggestions]);

  const flatItems = useMemo(() => flattenUnique(sections), [sections]);

  const navigate = useCallback(
    (item: Item) => {
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  const runFullSearch = useCallback(() => {
    if (!hasQuery) return;
    setOpen(false);
    router.push(`/people?q=${encodeURIComponent(trimmed)}`);
  }, [hasQuery, trimmed, router]);

  const { activeKey, setActiveKey, handleKeyDown } = useListNav(flatItems, {
    onSelect: navigate,
    onEscape: () => setOpen(false),
    onEnterEmpty: runFullSearch,
    onArrowOpen: () => setOpen(true),
  });

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function handleFocus() {
    setOpen(true);
    refreshRecent();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onQueryChange(e.target.value);
    setOpen(true);
  }

  const showDropdown = open && (sections.length > 0 || loading || hasQuery);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="universal-search-listbox"
        aria-autocomplete="list"
        autoFocus={autoFocus}
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder="Search people, companies, events, tags..."
        autoComplete="off"
        data-shortcut-search
        className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base shadow-sm transition-colors placeholder:text-gray-400 focus:border-gray-500 focus:outline-none dark:bg-[#161b22]"
      />

      {showDropdown && (
        <div
          id="universal-search-listbox"
          role="listbox"
          className="atlas-dropdown absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:bg-[#161b22]"
        >
          <SearchResultsList
            sections={sections}
            activeKey={activeKey}
            onHover={setActiveKey}
            onSelect={navigate}
            loading={loading}
            emptyMessage={
              hasQuery ? `No matches for “${trimmed}”.` : null
            }
          />
        </div>
      )}
    </div>
  );
}
