import type { ButtonHTMLAttributes } from "react";

import { AISparkleIcon } from "./AISparkleIcon";

export type AIButtonVariant = "solid" | "outline" | "ghost" | "chip";
export type AIButtonSize = "sm" | "md";

type AIButtonProps = {
  variant?: AIButtonVariant;
  size?: AIButtonSize;
  /** Prefixes AISparkleIcon. Default true. */
  icon?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const VARIANT_CLASS: Record<AIButtonVariant, string> = {
  // Primary
  solid:
    "rounded-md font-medium shadow-sm bg-teal-600 text-white hover:bg-teal-500 dark:bg-teal-500 dark:text-[#04120f] dark:hover:bg-teal-400",
  // Secondary
  outline:
    "rounded-md font-medium border border-teal-200 bg-teal-50/60 text-teal-700 hover:bg-teal-100 hover:border-teal-300 dark:border-teal-800/50 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/15",
  // Tertiary (link-style)
  ghost: "text-teal-700 hover:underline dark:text-teal-300",
  // Tertiary (pill)
  chip: "rounded-full border border-teal-200 bg-white text-teal-700 hover:bg-teal-50 dark:border-teal-800/50 dark:bg-transparent dark:text-teal-300 dark:hover:bg-teal-500/10",
};

const SIZE_CLASS: Record<AIButtonSize, string> = {
  sm: "text-xs px-2.5 py-1.5",
  md: "text-sm px-3 py-1.5",
};

/**
 * The AI design system's core button primitive — every Ask Atlas / Meeting
 * Brief trigger renders through this (directly or via AskAtlasButton /
 * MeetingBriefButton) so the teal identity and tier system (variant =
 * Primary/Secondary/Tertiary) live in one place.
 */
export function AIButton({ variant = "outline", size = "sm", icon = true, className, children, ...rest }: AIButtonProps) {
  return (
    <button
      className={
        className ??
        `inline-flex items-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 disabled:opacity-40 ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]}`
      }
      {...rest}
    >
      {icon && <AISparkleIcon className="h-3 w-3 shrink-0" />}
      {children}
    </button>
  );
}
