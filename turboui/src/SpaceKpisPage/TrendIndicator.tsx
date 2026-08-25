import React from "react";

import { IconChevronDown, IconChevronUp, IconMinus } from "../icons";
import classNames from "../utils/classnames";
import { formatNumber } from "./utils";

// Compact up/down/flat change since the previous entry. `delta === null` means we
// cannot compute a trend yet (fewer than 2 entries).
//
// The plain variant sits in dense contexts such as list rows; the badge variant
// carries a tinted pill so it holds its own next to a KPI's headline value.
export function TrendIndicator({ delta, variant = "plain" }: { delta: number | null; variant?: "plain" | "badge" }) {
  if (delta === null) return null;

  const isBadge = variant === "badge";

  if (delta === 0) {
    return (
      <span
        className={classNames("inline-flex items-center gap-0.5 text-xs text-content-dimmed", {
          "rounded-full bg-surface-dimmed px-1.5 py-0.5": isBadge,
        })}
        title="No change"
      >
        <IconMinus size={12} />
      </span>
    );
  }

  const isUp = delta > 0;
  const Icon = isUp ? IconChevronUp : IconChevronDown;

  const className = classNames("inline-flex items-center gap-0.5 text-xs font-medium", {
    "text-callout-success-content": isUp,
    "text-callout-error-content": !isUp,
    "rounded-full px-1.5 py-0.5": isBadge,
    "bg-callout-success-bg": isBadge && isUp,
    "bg-callout-error-bg": isBadge && !isUp,
  });

  return (
    <span className={className} title={`${isUp ? "+" : "−"}${formatNumber(Math.abs(delta))} vs previous`}>
      <Icon size={12} />
      {formatNumber(Math.abs(delta))}
    </span>
  );
}
