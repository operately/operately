import React from "react";

import classNames from "../utils/classnames";
import type { SpaceKpisPage } from "./types";

interface KpiSparklineProps {
  // Entries ordered oldest -> newest, as stored on a KPI.
  entries: SpaceKpisPage.KpiEntry[];
  width?: number;
  height?: number;
  testId?: string;
}

// Minimal, dependency-free sparkline — the same SVG plotting approach as
// KpiLineChart, stripped down to a trend line over a gradient that fades out
// towards the baseline (no axes, gridlines, dots, or labels). Coloured by
// overall direction: up = success, down = error.
//
// Used inline wherever a KPI is listed: the space dashboard summary card and
// the KPI list. Renders nothing when there is no history to plot.
export function KpiSparkline({ entries, width = 56, height = 24, testId }: KpiSparklineProps) {
  const pad = 2;

  // The gradient lives in the SVG's own <defs>, so each instance needs an id of
  // its own to reference (colons from useId are not valid in a URL fragment).
  const gradientId = `kpi-sparkline-gradient-${React.useId().replace(/:/g, "")}`;

  if (entries.length === 0) return null;

  const values = entries.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) || 1;

  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  const x = (index: number) => (entries.length === 1 ? width / 2 : pad + (innerWidth * index) / (entries.length - 1));
  const y = (value: number) => pad + innerHeight * (1 - (value - min) / span);

  // Both the line and its gradient are drawn in `currentColor`, so the
  // direction is expressed once as a text colour.
  const direction = values[values.length - 1]! - values[0]!;
  const colorClass =
    direction > 0 ? "text-callout-success-content" : direction < 0 ? "text-callout-error-content" : "text-blue-500";

  if (entries.length === 1) {
    const cy = height / 2;
    return (
      <svg width={width} height={height} className="shrink-0" aria-hidden data-test-id={testId}>
        <line
          x1={pad}
          x2={width - pad}
          y1={cy}
          y2={cy}
          className="stroke-surface-outline"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <circle cx={width / 2} cy={cy} r={2} className="fill-blue-500" />
      </svg>
    );
  }

  const linePath = entries.map((entry, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(entry.value)}`).join(" ");
  const areaPath = `${linePath} L ${x(entries.length - 1)} ${height} L ${x(0)} ${height} Z`;

  return (
    <svg width={width} height={height} className={classNames("shrink-0", colorClass)} aria-hidden data-test-id={testId}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        className="stroke-current"
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
