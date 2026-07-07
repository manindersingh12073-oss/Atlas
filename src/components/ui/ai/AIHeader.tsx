import type { ReactNode } from "react";

import { AIBadge } from "./AIBadge";
import { AISparkleIcon } from "./AISparkleIcon";

type AIHeaderProps = {
  title: string;
  action?: ReactNode;
  badge?: boolean;
};

/**
 * The one heading style every AI section in the app uses — teal + icon,
 * visually distinct from plain `text-base font-semibold` section headings
 * (Events, Follow-ups, etc.) so "Atlas Copilot" never blends in.
 */
export function AIHeader({ title, action, badge }: AIHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300">
        <AISparkleIcon className="h-4 w-4" />
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {badge && <AIBadge />}
        {action}
      </div>
    </div>
  );
}
