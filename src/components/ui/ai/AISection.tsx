import type { ReactNode } from "react";

import { AIHeader } from "./AIHeader";

type AISectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  badge?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * The one wrapper every inline "Atlas Copilot" section on a page uses
 * (dashboard, person page, Insights) — a teal-tinted card with the shared
 * AIHeader, so every AI section reads as part of one consistent surface.
 */
export function AISection({ title, description, action, badge, className, children }: AISectionProps) {
  return (
    <section
      className={`rounded-xl border border-teal-100 bg-gradient-to-b from-teal-50/40 to-transparent p-4 dark:border-teal-900/40 dark:from-teal-500/[0.04] ${className ?? ""}`}
    >
      <AIHeader title={title} action={action} badge={badge} />
      {description && <p className="mt-1 text-xs text-gray-500 dark:text-[#8b949e]">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
