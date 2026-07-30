import React from "react";

import { KpiDataPoint } from "./types";

interface KpiChartProps {
  dataPoints: KpiDataPoint[];
  unit?: string;
  /** overall width in px */
  width?: number;
  /** overall height in px */
  height?: number;
  /** show value labels + axis ticks (fuller view vs. compact sparkline) */
  detailed?: boolean;
}

/**
 * A dependency-free SVG line chart for KPI data points.
 *
 * POC note: this is deliberately hand-rolled to keep the slice thin and avoid a
 * charting-library decision at POC stage. The follow-up hardening PR should
 * evaluate a shared chart primitive (e.g. a small wrapper around a lib, or a
 * reusable turboui `<LineChart/>`), since KPIs, check-ins and goals could all
 * share it. See index.stories.tsx "Reviewer notes".
 */
export function KpiChart({ dataPoints, unit, width = 300, height = 120, detailed = false }: KpiChartProps) {
  const sorted = React.useMemo(
    () => [...dataPoints].sort((a, b) => a.recordedFor.localeCompare(b.recordedFor)),
    [dataPoints],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center text-content-subtle text-xs italic" style={{ width, height }}>
        No data points yet
      </div>
    );
  }

  const padding = detailed ? { top: 16, right: 16, bottom: 24, left: 40 } : { top: 8, right: 8, bottom: 8, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const values = sorted.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  // Single point: render a centered dot so the chart still communicates state.
  const xFor = (i: number) => (sorted.length === 1 ? innerW / 2 : (i / (sorted.length - 1)) * innerW);
  const yFor = (v: number) => innerH - ((v - min) / span) * innerH;

  const points = sorted.map((d, i) => ({
    x: padding.left + xFor(i),
    y: padding.top + yFor(d.value),
    dp: d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath =
    `M ${points[0]!.x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} ` +
    points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    ` L ${points[points.length - 1]!.x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`;

  const stroke = "var(--color-accent-1)";
  const last = points[points.length - 1]!;

  const formatValue = (v: number) => {
    const num = Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (!unit) return num;
    return unit === "$" ? `${unit}${num}` : `${num} ${unit}`;
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Line chart with ${sorted.length} data point${sorted.length === 1 ? "" : "s"}`}
    >
      {detailed && (
        <>
          {[max, (max + min) / 2, min].map((v, i) => {
            const y = padding.top + yFor(v);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="var(--color-stroke-base)"
                  strokeDasharray="3 3"
                />
                <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--color-content-subtle)">
                  {formatValue(Number(v.toFixed(1)))}
                </text>
              </g>
            );
          })}
        </>
      )}

      <path d={areaPath} fill={stroke} opacity={0.1} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={detailed ? 3.5 : 2.5} fill={stroke}>
          <title>
            {p.dp.recordedFor}: {formatValue(p.dp.value)}
          </title>
        </circle>
      ))}

      {/* Emphasise the latest value */}
      <circle
        cx={last.x}
        cy={last.y}
        r={detailed ? 5 : 3.5}
        fill={stroke}
        stroke="var(--color-surface-base)"
        strokeWidth={2}
      />
    </svg>
  );
}
