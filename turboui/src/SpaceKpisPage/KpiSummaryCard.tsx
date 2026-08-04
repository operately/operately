import React from "react";

import { GhostButton } from "../Button";
import { IconChartColumn } from "../icons";
import classNames from "../utils/classnames";

import { TrendIndicator } from "./TrendIndicator";
import type { SpaceKpisPage } from "./types";
import { formatValue, latestEntry, latestTrend } from "./utils";

interface KpiSummaryCardProps {
  // The KPIs tracked by this space. May be empty.
  kpis: SpaceKpisPage.Kpi[];

  // Controls whether the empty state shows a "Track a KPI" call to action.
  // Defaults to true to match the KPIs tool, where any space member can manage.
  canManage?: boolean;

  // Caps how many KPI rows are listed, keeping the summary card compact. Defaults
  // to 7 to match the Tasks tool card on the space dashboard.
  maxRows?: number;

  testId?: string;
}

// Inner content for the KPIs tool card on the space home page. The app wraps
// this in the shared SpaceTools Container (same shell as Goals & Projects,
// Tasks, and Files) so the card matches their layout and hover behaviour.
export function KpiSummaryCard({ kpis, canManage = true, maxRows = 7, testId = "kpi-summary-card" }: KpiSummaryCardProps) {
  const isZeroState = kpis.length === 0;

  return (
    <div data-test-id={testId}>
      {isZeroState ? <ZeroState canManage={canManage} /> : <RegularState kpis={kpis} maxRows={maxRows} />}
    </div>
  );
}

function RegularState({ kpis, maxRows }: { kpis: SpaceKpisPage.Kpi[]; maxRows: number }) {
  const visibleKpis = kpis.slice(0, maxRows);

  return (
    <div className="flex flex-col h-full">
      <Title />

      <div className="bg-surface-dimmed rounded mx-2 flex-1">
        {visibleKpis.map((kpi) => (
          <KpiRow key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}

function Title() {
  return <div className="font-bold text-base text-center py-2">KPIs</div>;
}

function KpiRow({ kpi }: { kpi: SpaceKpisPage.Kpi }) {
  const latest = latestEntry(kpi);
  const trend = latestTrend(kpi);

  return (
    <div
      className="flex items-center justify-between gap-2 py-2 px-2 border-b border-stroke-base last:border-b-0"
      data-test-id={`kpi-summary-row-${kpi.id}`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-bold truncate">{kpi.name}</div>
        {latest ? (
          <div className="mt-0.5 flex items-center gap-2 text-[10px]">
            <span className="font-medium text-content-base">{formatValue(latest.value, kpi.unit)}</span>
            <TrendIndicator delta={trend} />
          </div>
        ) : (
          <div className="mt-0.5 text-[10px] text-content-subtle" data-test-id={`kpi-summary-no-data-${kpi.id}`}>
            No data
          </div>
        )}
      </div>

      <Sparkline entries={kpi.entries} />
    </div>
  );
}

// Minimal, dependency-free sparkline — the same SVG plotting approach as
// KpiLineChart, stripped down to just a trend line (no axes, gridlines, dots,
// or labels). Coloured by overall direction: up = success, down = error.
function Sparkline({ entries }: { entries: SpaceKpisPage.KpiEntry[] }) {
  const width = 56;
  const height = 24;
  const pad = 2;

  if (entries.length === 0) return null;

  const values = entries.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) || 1;

  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  const x = (index: number) => (entries.length === 1 ? width / 2 : pad + (innerWidth * index) / (entries.length - 1));
  const y = (value: number) => pad + innerHeight * (1 - (value - min) / span);

  const direction = values[values.length - 1]! - values[0]!;
  const strokeClass =
    direction > 0 ? "stroke-callout-success-content" : direction < 0 ? "stroke-callout-error-content" : "stroke-blue-500";

  if (entries.length === 1) {
    const cy = height / 2;
    return (
      <svg width={width} height={height} className="shrink-0" aria-hidden>
        <line x1={pad} x2={width - pad} y1={cy} y2={cy} className="stroke-surface-outline" strokeWidth={1.5} strokeDasharray="3 3" />
        <circle cx={width / 2} cy={cy} r={2} className="fill-blue-500" />
      </svg>
    );
  }

  const linePath = entries.map((entry, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(entry.value)}`).join(" ");

  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      <path d={linePath} className={strokeClass} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ZeroState({ canManage }: { canManage: boolean }) {
  return (
    <div data-test-id="kpi-summary-card-empty">
      <Examples />
      <ExplanationAndButton canManage={canManage} />
    </div>
  );
}

function ExplanationAndButton({ canManage }: { canManage: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center group">
      <div className="text-base font-bold">KPIs</div>

      <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
        Track the numbers this space cares about and log updates on a weekly or monthly cadence.
      </div>

      {canManage && <GhostButton size="sm">Track a KPI</GhostButton>}
    </div>
  );
}

function Examples() {
  return (
    <div className="relative w-full h-[170px] mt-10 opacity-75 px-[50px] flex flex-col gap-3">
      <Example name="Monthly revenue" value="$42k" trend="up" />
      <Example name="NPS score" value="68" trend="flat" />
      <Example name="Uptime" value="99.9%" trend="up" />
    </div>
  );
}

function Example({ name, value, trend }: { name: string; value: string; trend: "up" | "down" | "flat" }) {
  const iconClass = classNames(
    "bg-stone-300",
    "group-hover:bg-green-300",
    "group-hover:text-stone-900",
    "dark:bg-stone-600",
    "dark:group-hover:bg-green-500",
    "rounded-full p-1.5 transition-all",
  );

  const strokeClass =
    trend === "up" ? "stroke-callout-success-content" : trend === "down" ? "stroke-callout-error-content" : "stroke-blue-500";

  return (
    <div className="flex items-center justify-between gap-2 group-hover:gap-3 transition-all shadow-sm pb-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className={iconClass}>
          <IconChartColumn size={18} stroke={1.5} />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[10px] leading-none truncate">{name}</div>
          <div className="text-[10px]">{value}</div>
        </div>
      </div>

      <svg width={48} height={18} className="shrink-0" aria-hidden>
        <path
          d={trend === "down" ? "M 2 4 L 14 10 L 26 8 L 38 14 L 46 16" : "M 2 14 L 14 10 L 26 12 L 38 6 L 46 4"}
          className={strokeClass}
          strokeWidth={1.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
