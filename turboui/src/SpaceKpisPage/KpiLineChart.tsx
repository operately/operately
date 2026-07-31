import React from "react";

import type { SpaceKpisPage } from "./types";
import { formatNumber, formatShortDate } from "./utils";

interface KpiLineChartProps {
  entries: SpaceKpisPage.KpiEntry[];
  unit: string;
  height?: number;
}

// Lightweight SVG line chart mirroring the goal target progress chart pattern.
// It plots a KPI's historical values over time with min/max gridlines, a
// filled area under the line, and dots + tooltips for each recorded entry.
//
// Deliberately dependency-free so it renders identically in Storybook and the app.
export function KpiLineChart({ entries, unit, height = 220 }: KpiLineChartProps) {
  if (entries.length === 0) {
    return <EmptyChart height={height} />;
  }

  if (entries.length === 1) {
    return <SinglePointChart entry={entries[0]!} unit={unit} height={height} />;
  }

  return <MultiPointChart entries={entries} unit={unit} height={height} />;
}

const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };
const VIEW_WIDTH = 640;

function MultiPointChart({ entries, unit, height }: Required<KpiLineChartProps>) {
  const values = entries.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Give the line vertical breathing room so a flat series is not glued to an edge.
  const span = max - min || Math.abs(max) || 1;
  const yMin = min - span * 0.15;
  const yMax = max + span * 0.15;

  const innerWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;

  const x = (index: number) => PADDING.left + (innerWidth * index) / (entries.length - 1);
  const y = (value: number) => PADDING.top + innerHeight * (1 - (value - yMin) / (yMax - yMin));

  const points = entries.map((entry, index) => ({ entry, cx: x(index), cy: y(entry.value) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p.cy}`).join(" ");
  const areaPath =
    `${linePath} L ${points[points.length - 1]!.cx} ${PADDING.top + innerHeight}` +
    ` L ${points[0]!.cx} ${PADDING.top + innerHeight} Z`;

  const gridLines = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <div className="w-full" data-test-id="kpi-line-chart">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="KPI history line chart"
      >
        {gridLines.map((value, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              x2={VIEW_WIDTH - PADDING.right}
              y1={y(value)}
              y2={y(value)}
              className="stroke-surface-outline"
              strokeWidth={1}
              strokeDasharray={i === gridLines.length - 1 ? undefined : "4 4"}
            />
            <text
              x={PADDING.left - 8}
              y={y(value) + 4}
              textAnchor="end"
              className="fill-content-dimmed"
              style={{ fontSize: 11 }}
            >
              {formatNumber(value)}
            </text>
          </g>
        ))}

        <path d={areaPath} className="fill-blue-500/10" />
        <path
          d={linePath}
          className="stroke-blue-500"
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <g key={p.entry.id}>
            <circle cx={p.cx} cy={p.cy} r={4} className="fill-surface-base stroke-blue-500" strokeWidth={2}>
              <title>{`${formatNumber(p.entry.value)}${unit ? ` ${unit}` : ""}`}</title>
            </circle>
            {(i === 0 || i === points.length - 1) && (
              <text
                x={p.cx}
                y={PADDING.top + innerHeight + 18}
                textAnchor={i === 0 ? "start" : "end"}
                className="fill-content-dimmed"
                style={{ fontSize: 11 }}
              >
                {formatShortDate(p.entry.recordedAt)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function SinglePointChart({ entry, unit, height }: { entry: SpaceKpisPage.KpiEntry; unit: string; height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-outline bg-surface-dimmed text-center"
      style={{ height }}
      data-test-id="kpi-line-chart-single"
    >
      <div className="text-2xl font-bold text-content-accent">
        {formatNumber(entry.value)}
        {unit ? <span className="ml-1 text-base font-medium text-content-dimmed">{unit}</span> : null}
      </div>
      <div className="mt-1 text-sm text-content-dimmed">Recorded {formatShortDate(entry.recordedAt)}</div>
      <div className="mt-3 text-xs text-content-subtle">Log another update to start plotting a trend line.</div>
    </div>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-outline bg-surface-dimmed text-center"
      style={{ height }}
      data-test-id="kpi-line-chart-empty"
    >
      <div className="text-sm font-medium text-content-dimmed">No data yet</div>
      <div className="mt-1 text-xs text-content-subtle">Log an update to see values plotted over time.</div>
    </div>
  );
}
