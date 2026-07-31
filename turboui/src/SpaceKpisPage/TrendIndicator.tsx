import React from "react";

import { IconChevronDown, IconChevronUp, IconMinus } from "../icons";
import { formatNumber } from "./utils";

// Compact up/down/flat badge showing the change since the previous entry.
// `delta === null` means we cannot compute a trend yet (fewer than 2 entries).
export function TrendIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return null;

  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-content-dimmed" title="No change">
        <IconMinus size={12} />
      </span>
    );
  }

  const isUp = delta > 0;
  const className = isUp ? "text-callout-success-content" : "text-callout-error-content";
  const Icon = isUp ? IconChevronUp : IconChevronDown;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${className}`}
      title={`${isUp ? "+" : "−"}${formatNumber(Math.abs(delta))} vs previous`}
    >
      <Icon size={12} />
      {formatNumber(Math.abs(delta))}
    </span>
  );
}
