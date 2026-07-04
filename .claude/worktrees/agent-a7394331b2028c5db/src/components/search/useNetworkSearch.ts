"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SearchResults } from "@/lib/search/queries";
import { readRecentPeople, type RecentPerson } from "@/lib/search/recent-people";

const EMPTY: SearchResults = {
  people: [],
  companies: [],
  tags: [],
  events: [],
  relationships: [],
};

/**
 * The single client-side entry point to the universal search engine.
 * Owns the query, debounced fetch to /api/search, loading, and the
 * localStorage recent-people list. Shared by the inline search bar and the
 * command palette so there is exactly one search implementation on the client.
 */
export function useNetworkSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentPeople, setRecentPeople] = useState<RecentPerson[]>([]);
  const seqRef = useRef(0);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  // Debounced fetch. The effect only schedules async work; every state update
  // happens inside the (async) timeout callback — no synchronous setState in
  // the effect body. Clearing on empty query is handled in onQueryChange.
  useEffect(() => {
    if (!hasQuery) return;

    const seq = ++seqRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = (await res.json()) as SearchResults;
        if (seq === seqRef.current) {
          setResults(data);
          setLoading(false);
        }
      } catch {
        if (seq === seqRef.current) {
          setResults(EMPTY);
          setLoading(false);
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [trimmed, hasQuery]);

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
    } else {
      setResults(null);
      setLoading(false);
    }
  }, []);

  /** Re-reads recent-viewed people from localStorage (call on focus/open). */
  const refreshRecent = useCallback(() => {
    setRecentPeople(readRecentPeople());
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setResults(null);
    setLoading(false);
    seqRef.current++; // invalidate any in-flight response
  }, []);

  return {
    query,
    trimmed,
    hasQuery,
    results,
    loading,
    recentPeople,
    onQueryChange,
    refreshRecent,
    reset,
  };
}
