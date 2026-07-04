"use client";

import { useEffect, useRef, useState } from "react";

type CountUpStatProps = {
  value: number;
  label: string;
  suffix?: string;
  duration?: number;
};

// Counts up from 0 to `value` once the stat scrolls into view. Jumps
// straight to the final value under prefers-reduced-motion.
export function CountUpStat({
  value,
  label,
  suffix = "",
  duration = 1200,
}: CountUpStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion jumps straight to the final value via the rAF callback
    // below (fired async, not synchronously within the effect body).
    if (reduceMotion) {
      const frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }

    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value, duration]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
        {display.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-[#8b949e]">{label}</p>
    </div>
  );
}
