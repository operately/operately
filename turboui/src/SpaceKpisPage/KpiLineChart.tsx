import React from "react";

import type { SpaceKpisPage } from "./types";
import { formatNumber, formatShortDate, formatValue } from "./utils";

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
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const values = entries.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Pin the y-axis minimum at zero so a high-baseline, low-variance series is
  // shown in true proportion rather than having small fluctuations visually
  // exaggerated by an auto-scaled minimum. The maximum still auto-scales, with
  // headroom above the largest value so the line is not glued to the top edge.
  const span = max - min || Math.abs(max) || 1;
  const yMin = 0;
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
  const baseline = PADDING.top + innerHeight;
  const hovered = hoveredIndex === null ? null : (points[hoveredIndex] ?? null);

  return (
    <div className="w-full" data-test-id="kpi-line-chart">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="KPI history line chart"
        onMouseLeave={() => setHoveredIndex(null)}
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
              data-test-id={i === gridLines.length - 1 ? "kpi-chart-y-axis-min" : undefined}
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

        {hovered && (
          <line
            x1={hovered.cx}
            x2={hovered.cx}
            y1={PADDING.top}
            y2={baseline}
            className="stroke-blue-500/40"
            strokeWidth={1}
          />
        )}

        {points.map((p, i) => (
          <g key={p.entry.id}>
            <circle
              cx={p.cx}
              cy={p.cy}
              r={hoveredIndex === i ? 6 : 4}
              className="fill-surface-base stroke-blue-500"
              strokeWidth={2}
            />
            {(i === 0 || i === points.length - 1) && (
              <text
                x={p.cx}
                y={baseline + 18}
                textAnchor={i === 0 ? "start" : "end"}
                className="fill-content-dimmed"
                style={{ fontSize: 11 }}
              >
                {formatShortDate(p.entry.recordedAt)}
              </text>
            )}
          </g>
        ))}

        {/* Invisible bands, one per entry, so hovering anywhere in a point's
            vertical slice reveals its value without pointer coordinate math. */}
        {points.map((p, i) => {
          const prev = points[i - 1];
          const next = points[i + 1];
          const left = prev ? (prev.cx + p.cx) / 2 : PADDING.left;
          const right = next ? (p.cx + next.cx) / 2 : VIEW_WIDTH - PADDING.right;

          return (
            <rect
              key={`hover-${p.entry.id}`}
              x={left}
              y={PADDING.top}
              width={Math.max(right - left, 1)}
              height={innerHeight}
              fill="transparent"
              data-test-id={`kpi-chart-hover-band-${i}`}
              onMouseEnter={() => setHoveredIndex(i)}
            />
          );
        })}

        {hovered && <Tooltip point={hovered} unit={unit} />}
      </svg>
    </div>
  );
}

interface ChartPoint {
  entry: SpaceKpisPage.KpiEntry;
  cx: number;
  cy: number;
}

const TOOLTIP = { height: 40, paddingX: 10, valueFontSize: 12, dateFontSize: 11, gap: 12 };

function Tooltip({ point, unit }: { point: ChartPoint; unit: string }) {
  const valueLabel = formatValue(point.entry.value, unit);
  const dateLabel = formatShortDate(point.entry.recordedAt);

  // Approximate the text width from character counts: measuring rendered SVG
  // text would require a layout pass the chart otherwise does not need.
  const textWidth = Math.max(
    valueLabel.length * TOOLTIP.valueFontSize * 0.6,
    dateLabel.length * TOOLTIP.dateFontSize * 0.55,
  );
  const width = textWidth + TOOLTIP.paddingX * 2;

  const clampedX = Math.min(Math.max(point.cx - width / 2, 4), VIEW_WIDTH - width - 4);
  const above = point.cy - TOOLTIP.gap - TOOLTIP.height;
  const boxY = above < 0 ? point.cy + TOOLTIP.gap : above;
  const centerX = clampedX + width / 2;

  return (
    <g pointerEvents="none" data-test-id="kpi-chart-tooltip">
      <rect
        x={clampedX}
        y={boxY}
        width={width}
        height={TOOLTIP.height}
        rx={4}
        className="fill-surface-base stroke-stroke-base"
        strokeWidth={1}
        style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))" }}
      />
      <text
        x={centerX}
        y={boxY + 17}
        textAnchor="middle"
        className="fill-content-accent"
        style={{ fontSize: TOOLTIP.valueFontSize, fontWeight: 600 }}
      >
        {valueLabel}
      </text>
      <text
        x={centerX}
        y={boxY + 31}
        textAnchor="middle"
        className="fill-content-dimmed"
        style={{ fontSize: TOOLTIP.dateFontSize }}
      >
        {dateLabel}
      </text>
    </g>
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
