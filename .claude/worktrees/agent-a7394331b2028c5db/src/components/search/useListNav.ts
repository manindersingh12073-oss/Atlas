"use client";

import { useMemo, useState } from "react";

import type { Item } from "./items";

/**
 * Keyboard navigation over a flat item list, shared by the inline search bar
 * and the command palette.
 *
 * Tracks the active row by *key* rather than index, so when the underlying
 * items change (new results arrive) a now-missing key simply resolves to "no
 * selection" without needing a setState-in-effect reset.
 *
 * Supports: ArrowDown, ArrowUp, Enter, Escape, Tab.
 */
export function useListNav(
  flatItems: Item[],
  handlers: {
    onSelect: (item: Item) => void;
    onEscape: () => void;
    onEnterEmpty?: () => void;
    onArrowOpen?: () => void;
  },
) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const activeIndex = useMemo(
    () => (activeKey ? flatItems.findIndex((i) => i.key === activeKey) : -1),
    [activeKey, flatItems],
  );

  function move(delta: number) {
    if (flatItems.length === 0) return;
    const next = activeIndex + delta;
    if (next < 0) {
      setActiveKey(null);
      return;
    }
    const clamped = Math.min(next, flatItems.length - 1);
    setActiveKey(flatItems[clamped].key);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        handlers.onArrowOpen?.();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Enter":
        if (activeIndex >= 0 && flatItems[activeIndex]) {
          e.preventDefault();
          handlers.onSelect(flatItems[activeIndex]);
        } else {
          handlers.onEnterEmpty?.();
        }
        break;
      case "Escape":
        handlers.onEscape();
        break;
      case "Tab":
        // Let focus move naturally; just dismiss the results.
        handlers.onEscape();
        break;
    }
  }

  return { activeKey, setActiveKey, activeIndex, handleKeyDown };
}
