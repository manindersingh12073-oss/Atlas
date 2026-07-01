"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import type { SearchSuggestions } from "@/lib/search/queries";
import {
  COMMAND_ACTIONS,
  actionItem,
  companyItem,
  eventItem,
  filterActions,
  flattenUnique,
  personItem,
  tagItem,
  type Item,
  type Section,
} from "./items";
import { SearchResultsList } from "./SearchResultsList";
import { useListNav } from "./useListNav";
import { useNetworkSearch } from "./useNetworkSearch";

const EMPTY_SUGGESTIONS: SearchSuggestions = {
  recentEvents: [],
  popularTags: [],
  topCompanies: [],
};

/**
 * Global command palette (Cmd/Ctrl + K). A centred modal that runs the exact
 * same universal search engine as the inline bar, plus a set of navigation /
 * creation Actions. Mounted once in the protected layout.
 */
export function CommandPalette() {
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
    reset,
  } = useNetworkSearch();

  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const openRef = useRef(false);
  const suggestionsLoaded = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const closePalette = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const openPalette = useCallback(() => {
    setOpen(true);
    refreshRecent();
    if (!suggestionsLoaded.current) {
      suggestionsLoaded.current = true;
      (async () => {
        try {
          const res = await fetch("/api/search/suggestions");
          setSuggestions((await res.json()) as SearchSuggestions);
        } catch {
          setSuggestions(EMPTY_SUGGESTIONS);
        }
      })();
    }
  }, [refreshRecent]);

  // Global Cmd/Ctrl + K toggles the palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) closePalette();
        else openPalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette, closePalette]);

  // ── Build sections (People, Events, Companies, Tags, Actions) ───────────────
  const sections = useMemo<Section[]>(() => {
    const s = suggestions ?? EMPTY_SUGGESTIONS;
    const out: Section[] = [];

    if (!hasQuery) {
      if (recentPeople.length > 0)
        out.push({
          heading: "People",
          items: recentPeople.slice(0, 5).map(personItem),
        });
      if (s.recentEvents.length > 0)
        out.push({ heading: "Events", items: s.recentEvents.map(eventItem) });
      if (s.topCompanies.length > 0)
        out.push({ heading: "Companies", items: s.topCompanies.map(companyItem) });
      if (s.popularTags.length > 0)
        out.push({ heading: "Tags", items: s.popularTags.map(tagItem) });
      out.push({
        heading: "Actions",
        items: COMMAND_ACTIONS.map(actionItem),
      });
      return out;
    }

    if (results) {
      if (results.people.length > 0)
        out.push({ heading: "People", items: results.people.map(personItem) });
      if (results.events.length > 0)
        out.push({ heading: "Events", items: results.events.map(eventItem) });
      if (results.companies.length > 0)
        out.push({ heading: "Companies", items: results.companies.map(companyItem) });
      if (results.tags.length > 0)
        out.push({ heading: "Tags", items: results.tags.map(tagItem) });
    }
    const actions = filterActions(trimmed);
    if (actions.length > 0)
      out.push({ heading: "Actions", items: actions.map(actionItem) });
    return out;
  }, [hasQuery, results, recentPeople, suggestions, trimmed]);

  const flatItems = useMemo(() => flattenUnique(sections), [sections]);

  const select = useCallback(
    (item: Item) => {
      closePalette();
      router.push(item.href);
    },
    [closePalette, router],
  );

  const { activeKey, setActiveKey, handleKeyDown } = useListNav(flatItems, {
    onSelect: select,
    onEscape: closePalette,
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[15vh]"
      onMouseDown={closePalette}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="atlas-dropdown w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-[#30363d] dark:bg-[#161b22]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          type="search"
          role="combobox"
          aria-expanded
          aria-controls="command-palette-listbox"
          aria-autocomplete="list"
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or jump to…"
          autoComplete="off"
          className="block w-full border-b border-gray-200 bg-white px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none dark:border-[#30363d] dark:bg-[#161b22]"
        />
        <div
          id="command-palette-listbox"
          role="listbox"
          className="max-h-[60vh] overflow-y-auto py-1"
        >
          <SearchResultsList
            sections={sections}
            activeKey={activeKey}
            onHover={setActiveKey}
            onSelect={select}
            loading={loading}
            emptyMessage={hasQuery ? `No matches for “${trimmed}”.` : null}
          />
        </div>
      </div>
    </div>
  );
}
