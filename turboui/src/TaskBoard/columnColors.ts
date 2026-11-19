import type { StatusSelector } from "../StatusSelector";

export type ColumnColorMode = "vivid" | "soft" | "bordered" | "none";

export interface ColumnColorsPreference {
  value: ColumnColorMode;
  onChange: (mode: ColumnColorMode) => void;
}

const neutralColumn = "bg-surface-dimmed dark:border dark:border-stroke-base";

const columnColors = {
  gray: {
    vivid: "bg-gray-200 dark:bg-gray-800",
    soft: neutralColumn,
    bordered: "bg-surface-dimmed ring-1 ring-inset ring-gray-400 dark:ring-gray-600",
  },
  blue: {
    vivid: "bg-blue-200 dark:bg-blue-900",
    soft: "bg-blue-50 dark:bg-blue-950/40",
    bordered: "bg-surface-dimmed ring-1 ring-inset ring-blue-400 dark:ring-blue-700",
  },
  green: {
    vivid: "bg-emerald-200 dark:bg-emerald-900",
    soft: "bg-emerald-50 dark:bg-emerald-950/40",
    bordered: "bg-surface-dimmed ring-1 ring-inset ring-emerald-400 dark:ring-emerald-700",
  },
  red: {
    vivid: "bg-red-200 dark:bg-red-900",
    soft: "bg-red-50 dark:bg-red-950/40",
    bordered: "bg-surface-dimmed ring-1 ring-inset ring-red-400 dark:ring-red-700",
  },
} satisfies Record<StatusSelector.StatusColorName, Record<Exclude<ColumnColorMode, "none">, string>>;

export function columnColorClass(color: StatusSelector.StatusColorName, mode: ColumnColorMode): string {
  return mode === "none" ? neutralColumn : columnColors[color][mode];
}
