import React from "react";

import type { SpaceKpisPage } from "./types";
import { formatNumber, formatShortDate, formatValue } from "./utils";

interface KpiLineChartProps {
  entries: SpaceKpisPage.KpiEntry[];
  unit: string;
  height?: number;
  annotations?: SpaceKpisPage.KpiAnnotation[];
  onAnnotationClick?: (annotation: SpaceKpisPage.KpiAnnotation) => void;
}

// Lightweight SVG line chart mirroring the goal target progress chart pattern.
// It plots a KPI's historical values over time with min/max gridlines, a
// filled area under the line, and dots + tooltips for each recorded entry.
// Date-based annotations appear as vertical markers so events can be read
// against the series.
//
// Deliberately dependency-free so it renders identically in Storybook and the app.
export function KpiLineChart({ entries, unit, height = 220, annotations = [], onAnnotationClick }: KpiLineChartProps) {
  // Until there are two points to join there is nothing to plot, and the current
  // value is already on the page, so these states only say what is missing.
  if (entries.length === 0) {
    return (
      <Placeholder
        title="No data yet"
        hint="Values appear here once they are logged."
        testId="kpi-line-chart-empty"
        height={height}
      />
    );
  }

  if (entries.length === 1) {
    return (
      <Placeholder
        title="Only one update so far"
        hint="A second update is needed to plot a trend line."
        testId="kpi-line-chart-single"
        height={height}
      />
    );
  }

  return (
    <MultiPointChart
      entries={entries}
      unit={unit}
      height={height}
      annotations={annotations}
      onAnnotationClick={onAnnotationClick}
    />
  );
}

const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };
const VIEW_WIDTH = 640;

// Steps a reader recognises as round, so the gridlines are labelled 1.5M / 750K
// rather than the raw 1.47M / 734.9K the data happens to reach. Halves of these
// are round too, which matters because the middle gridline is labelled as well.
const AXIS_STEPS = [1, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3, 4, 5, 6, 8, 10];

function roundedAxisMax(value: number): number {
  if (value <= 0) return 1;

  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = AXIS_STEPS.find((candidate) => value <= candidate * magnitude) ?? 10;

  return step * magnitude;
}

const MARKER = { stem: 15, width: 9, height: 7, hitHalfWidth: 10 };

// A flag planted on the baseline, matching the icon on the "Add annotation"
// button, so the same shape means "a dated event" wherever it appears.
function annotationFlagPath(cx: number, baseline: number, hovered: boolean): string {
  const stem = hovered ? MARKER.stem + 3 : MARKER.stem;
  const top = baseline - stem;
  const width = hovered ? MARKER.width + 2 : MARKER.width;
  const height = hovered ? MARKER.height + 1 : MARKER.height;

  return `M ${cx} ${top + height} L ${cx + width} ${top + height / 2} L ${cx} ${top} Z`;
}

function MultiPointChart({
  entries,
  unit,
  height,
  annotations,
  onAnnotationClick,
}: Required<Pick<KpiLineChartProps, "entries" | "unit" | "height" | "annotations">> &
  Pick<KpiLineChartProps, "onAnnotationClick">) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = React.useState<string | null>(null);

  const values = entries.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Pin the y-axis minimum at zero so a high-baseline, low-variance series is
  // shown in true proportion rather than having small fluctuations visually
  // exaggerated by an auto-scaled minimum. The maximum still auto-scales, with
  // headroom above the largest value so the line is not glued to the top edge.
  const span = max - min || Math.abs(max) || 1;
  const yMin = 0;
  const yMax = roundedAxisMax(max + span * 0.15);

  const innerWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;

  const times = [
    ...entries.map((entry) => entry.recordedAt.getTime()),
    ...annotations.map((annotation) => annotation.date.getTime()),
  ];
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tSpan = tMax - tMin;

  const xAt = (time: number, index: number) => {
    if (tSpan <= 0) return PADDING.left + (innerWidth * index) / (entries.length - 1);
    return PADDING.left + (innerWidth * (time - tMin)) / tSpan;
  };
  const y = (value: number) => PADDING.top + innerHeight * (1 - (value - yMin) / (yMax - yMin));

  const points = entries.map((entry, index) => ({
    entry,
    cx: xAt(entry.recordedAt.getTime(), index),
    cy: y(entry.value),
  }));
  const annotationMarks = annotations.map((annotation, index) => ({
    annotation,
    cx: xAt(annotation.date.getTime(), index),
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p.cy}`).join(" ");
  const areaPath =
    `${linePath} L ${points[points.length - 1]!.cx} ${PADDING.top + innerHeight}` +
    ` L ${points[0]!.cx} ${PADDING.top + innerHeight} Z`;

  const gridLines = [yMax, (yMax + yMin) / 2, yMin];
  const baseline = PADDING.top + innerHeight;
  const hovered = hoveredIndex === null ? null : (points[hoveredIndex] ?? null);
  const hoveredAnnotation = annotationMarks.find((mark) => mark.annotation.id === hoveredAnnotationId) ?? null;

  return (
    <div className="w-full" data-test-id="kpi-line-chart">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="KPI history line chart"
        onMouseLeave={() => {
          setHoveredIndex(null);
          setHoveredAnnotationId(null);
        }}
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

        {/* Behind the series, so the data line reads as one unbroken stroke and
            the annotation only whispers where on the timeline it sits. */}
        {annotationMarks.map((mark) => (
          <line
            key={`annotation-line-${mark.annotation.id}`}
            x1={mark.cx}
            x2={mark.cx}
            y1={PADDING.top + 4}
            y2={baseline}
            className={hoveredAnnotationId === mark.annotation.id ? "stroke-amber-500/80" : "stroke-amber-500/40"}
            strokeWidth={1}
            strokeDasharray="3 4"
            strokeLinecap="round"
          />
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

        {hovered && !hoveredAnnotation && (
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
              r={hoveredIndex === i && !hoveredAnnotation ? 6 : 4}
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
              onMouseEnter={() => {
                setHoveredAnnotationId(null);
                setHoveredIndex(i);
              }}
            />
          );
        })}

        {/* Markers stand on the baseline, where the reader already looks for
            dates, and above the series so they stay legible over the fill. */}
        {annotationMarks.map((mark) => {
          const active = hoveredAnnotationId === mark.annotation.id;

          return (
            <g
              key={`annotation-marker-${mark.annotation.id}`}
              data-test-id={`kpi-chart-annotation-${mark.annotation.id}`}
            >
              <line
                x1={mark.cx}
                x2={mark.cx}
                y1={baseline}
                y2={baseline - (active ? MARKER.stem + 3 : MARKER.stem)}
                className="stroke-amber-500"
                strokeWidth={active ? 2 : 1.5}
                strokeLinecap="round"
              />
              <path
                d={annotationFlagPath(mark.cx, baseline, active)}
                className="fill-amber-500 stroke-amber-500"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {annotationMarks.map((mark) => (
          <rect
            key={`annotation-hit-${mark.annotation.id}`}
            x={mark.cx - 4}
            y={baseline - MARKER.stem - 4}
            width={MARKER.hitHalfWidth + 8}
            height={MARKER.stem + 14}
            fill="transparent"
            className={onAnnotationClick ? "cursor-pointer" : undefined}
            data-test-id={`kpi-chart-annotation-hit-${mark.annotation.id}`}
            onMouseEnter={() => {
              setHoveredIndex(null);
              setHoveredAnnotationId(mark.annotation.id);
            }}
            onClick={() => onAnnotationClick?.(mark.annotation)}
          />
        ))}

        {hoveredAnnotation ? (
          <AnnotationTooltip mark={hoveredAnnotation} baseline={baseline} />
        ) : hovered ? (
          <Tooltip point={hovered} unit={unit} />
        ) : null}
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
  // Cap the box so a long unit/date cannot push clampedX negative and clip
  // the tooltip outside the SVG viewport.
  const width = Math.min(textWidth + TOOLTIP.paddingX * 2, VIEW_WIDTH - 8);
  const clampedX = Math.max(4, Math.min(point.cx - width / 2, VIEW_WIDTH - width - 4));
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

const ANNOTATION_TOOLTIP = { paddingX: 11, paddingTop: 8, lineHeight: 15, titleMaxChars: 44 };

function AnnotationTooltip({
  mark,
  baseline,
}: {
  mark: { annotation: SpaceKpisPage.KpiAnnotation; cx: number };
  baseline: number;
}) {
  const dateLabel = formatShortDate(mark.annotation.date);
  const title = truncate(mark.annotation.title, ANNOTATION_TOOLTIP.titleMaxChars);

  const lines = 2;
  const height = ANNOTATION_TOOLTIP.paddingTop * 2 + lines * ANNOTATION_TOOLTIP.lineHeight;
  const textWidth = Math.max(
    dateLabel.length * TOOLTIP.dateFontSize * 0.55,
    title.length * TOOLTIP.valueFontSize * 0.6,
  );
  const width = Math.min(Math.max(textWidth + ANNOTATION_TOOLTIP.paddingX * 2, 120), VIEW_WIDTH - 8);
  const clampedX = Math.max(4, Math.min(mark.cx - width / 2, VIEW_WIDTH - width - 4));
  // Floats just above the marker it belongs to and stays inside the plot area.
  const boxY = Math.max(PADDING.top, baseline - MARKER.stem - 12 - height);
  const textX = clampedX + ANNOTATION_TOOLTIP.paddingX;
  const firstBaseline = boxY + ANNOTATION_TOOLTIP.paddingTop + 11;

  return (
    <g pointerEvents="none" data-test-id="kpi-chart-annotation-tooltip">
      <rect
        x={clampedX}
        y={boxY}
        width={width}
        height={height}
        rx={6}
        className="fill-surface-base stroke-stroke-base"
        strokeWidth={1}
        style={{ filter: "drop-shadow(0 2px 6px rgb(0 0 0 / 0.12))" }}
      />
      <text
        x={textX}
        y={firstBaseline}
        className="fill-content-accent"
        style={{ fontSize: TOOLTIP.valueFontSize, fontWeight: 600 }}
      >
        {title}
      </text>
      <text
        x={textX}
        y={firstBaseline + ANNOTATION_TOOLTIP.lineHeight}
        className="fill-content-dimmed"
        style={{ fontSize: TOOLTIP.dateFontSize }}
      >
        {dateLabel}
      </text>
    </g>
  );
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

function Placeholder({ title, hint, testId, height }: { title: string; hint: string; testId: string; height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{ height }}
      data-test-id={testId}
    >
      <div className="text-sm font-medium text-content-dimmed">{title}</div>
      <div className="mt-1 text-xs text-content-subtle">{hint}</div>
    </div>
  );
}
