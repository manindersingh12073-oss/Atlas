"use client";

import { useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  children: React.ReactNode;
  as?: "div" | "section" | "li" | "article" | "span";
  delay?: number;
  className?: string;
};

// Fades + lifts content in once, the first time it scrolls into view.
// Pure IntersectionObserver + CSS transitions — no animation library.
export function ScrollReveal({
  children,
  as = "div",
  delay = 0,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Cast needed because a dynamic intrinsic tag can't be typed against a
  // union of element ref types (HTMLDivElement | HTMLLIElement | ...) —
  // the ref itself is always attached to whichever tag is actually rendered.
  const Tag = as as "div";

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
