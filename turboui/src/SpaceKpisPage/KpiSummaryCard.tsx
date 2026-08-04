import React from "react";

import { DivLink } from "../Link";
import { IconArrowRight, IconChartColumn } from "../icons";
import classNames from "../utils/classnames";

import { TrendIndicator } from "./TrendIndicator";
import type { SpaceKpisPage } from "./types";
import { formatValue, latestEntry, latestTrend } from "./utils";

interface KpiSummaryCardProps {
  // The KPIs tracked by this space. May be empty.
  kpis: SpaceKpisPage.Kpi[];

  // Link to the space's full KPIs tab. The whole card links here, as do the
  // header and empty-state call to action.
  spaceKpisLink: string;

  // Called when a KPI row is clicked. Mirrors `KpiList`'s row `onSelect` so the
  // parent can open that KPI's detail view. When omitted, clicking a row falls
  // through to the card-level link (the KPIs tab).
  onSelectKpi?: (kpiId: string) => void;

  // Controls whether the empty state shows a "Track a KPI" call to action.
  // Defaults to true to match the KPIs tool, where any space member can manage.
  canManage?: boolean;

  // Caps how many KPI rows are listed before collapsing the rest into a
  // "+N more" footer, keeping the summary card compact. Defaults to 4.
  maxRows?: number;

  testId?: string;
}

// Compact summary of a space's KPIs, intended for the space home page alongside
// the other tool cards (Goals & Projects, Discussions, Tasks...). Unlike the
// company-level SpaceCards/SpaceCard (a directory of spaces), this lives inside
// a single space and summarises *that space's* KPIs: each row shows the KPI
// name, its latest value, a trend indicator, and a dependency-free sparkline of
// recent entries.
export function KpiSummaryCard({
  kpis,
  spaceKpisLink,
  onSelectKpi,
  canManage = true,
  maxRows = 4,
  testId = "kpi-summary-card",
}: KpiSummaryCardProps) {
  const cardClass = classNames(
    "flex flex-col",
    "w-full max-w-[340px]",
    "bg-surface-base",
    "border border-stroke-base",
    "rounded-lg shadow-sm",
    "overflow-hidden",
  );

  if (kpis.length === 0) {
    return (
      <div className={cardClass} data-test-id={testId}>
        <CardHeader spaceKpisLink={spaceKpisLink} />
        <EmptyState spaceKpisLink={spaceKpisLink} canManage={canManage} />
      </div>
    );
  }

  const visibleKpis = kpis.slice(0, maxRows);
  const hiddenCount = kpis.length - visibleKpis.length;

  return (
    <div className={cardClass} data-test-id={testId}>
      <CardHeader spaceKpisLink={spaceKpisLink} />

      <div className="divide-y divide-stroke-dimmed">
        {visibleKpis.map((kpi) => (
          <KpiRow key={kpi.id} kpi={kpi} spaceKpisLink={spaceKpisLink} onSelectKpi={onSelectKpi} />
        ))}
      </div>

      <DivLink
        to={spaceKpisLink}
        className="border-t border-stroke-dimmed px-4 py-2.5 text-xs font-medium text-link-base hover:bg-surface-highlight"
        testId={`${testId}-view-all`}
      >
        {hiddenCount > 0 ? `View all ${kpis.length} KPIs` : "View all KPIs"}
      </DivLink>
    </div>
  );
}

function CardHeader({ spaceKpisLink }: { spaceKpisLink: string }) {
  return (
    <DivLink
      to={spaceKpisLink}
      className="group flex items-center justify-between gap-2 border-b border-stroke-base px-4 py-3 hover:bg-surface-highlight"
      testId="kpi-summary-card-header"
    >
      <div className="flex items-center gap-2">
        <IconChartColumn size={18} className="text-content-dimmed" />
        <span className="text-sm font-bold text-content-accent">KPIs</span>
      </div>
      <IconArrowRight
        size={16}
        className="text-content-dimmed transition-transform group-hover:translate-x-0.5 group-hover:text-content-base"
      />
    </DivLink>
  );
}

function KpiRow({
  kpi,
  spaceKpisLink,
  onSelectKpi,
}: {
  kpi: SpaceKpisPage.Kpi;
  spaceKpisLink: string;
  onSelectKpi?: (kpiId: string) => void;
}) {
  const latest = latestEntry(kpi);
  const trend = latestTrend(kpi);

  const rowClass =
    "group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-highlight";

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-content-accent group-hover:underline">{kpi.name}</div>
        {latest ? (
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs font-medium text-content-base">{formatValue(latest.value, kpi.unit)}</span>
            <TrendIndicator delta={trend} />
          </div>
        ) : (
          <div className="mt-0.5 text-xs text-content-subtle" data-test-id={`kpi-summary-no-data-${kpi.id}`}>
            No data
          </div>
        )}
      </div>

      <Sparkline entries={kpi.entries} />
    </>
  );

  // Mirror KpiList's row onSelect: clicking a row opens that KPI. When no
  // handler is provided, fall back to a link into the KPIs tab so the row is
  // still navigable.
  if (onSelectKpi) {
    return (
      <button
        type="button"
        className={rowClass}
        onClick={() => onSelectKpi(kpi.id)}
        data-test-id={`kpi-summary-row-${kpi.id}`}
      >
        {content}
      </button>
    );
  }

  return (
    <DivLink to={spaceKpisLink} className={rowClass} testId={`kpi-summary-row-${kpi.id}`}>
      {content}
    </DivLink>
  );
}

// Minimal, dependency-free sparkline — the same SVG plotting approach as
// KpiLineChart, stripped down to just a trend line (no axes, gridlines, dots,
// or labels). Coloured by overall direction: up = success, down = error.
function Sparkline({ entries }: { entries: SpaceKpisPage.KpiEntry[] }) {
  const width = 88;
  const height = 28;
  const pad = 3;

  if (entries.length === 0) return null;

  const values = entries.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) || 1;

  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  const x = (index: number) => (entries.length === 1 ? width / 2 : pad + (innerWidth * index) / (entries.length - 1));
  const y = (value: number) => pad + innerHeight * (1 - (value - min) / span);

  // Direction of travel from first to last recorded entry colours the line.
  const direction = values[values.length - 1]! - values[0]!;
  const strokeClass =
    direction > 0 ? "stroke-callout-success-content" : direction < 0 ? "stroke-callout-error-content" : "stroke-blue-500";

  // A single entry has no line to draw — show a flat marker instead.
  if (entries.length === 1) {
    const cy = height / 2;
    return (
      <svg width={width} height={height} className="shrink-0" aria-hidden>
        <line x1={pad} x2={width - pad} y1={cy} y2={cy} className="stroke-surface-outline" strokeWidth={1.5} strokeDasharray="3 3" />
        <circle cx={width / 2} cy={cy} r={2.5} className="fill-blue-500" />
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

function EmptyState({ spaceKpisLink, canManage }: { spaceKpisLink: string; canManage: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-8 text-center"
      data-test-id="kpi-summary-card-empty"
    >
      <IconChartColumn size={28} className="text-content-subtle" />
      <div className="mt-2 text-sm font-semibold text-content-accent">No KPIs tracked yet</div>
      <p className="mt-1 text-xs text-content-dimmed">
        Track the numbers this space cares about — pipeline, uptime, NPS.
      </p>
      {canManage && (
        <DivLink
          to={spaceKpisLink}
          className="mt-3 rounded-lg bg-brand-1 px-3 py-1.5 text-xs font-medium text-white-1 hover:bg-blue-600"
          testId="kpi-summary-card-empty-cta"
        >
          Track a KPI
        </DivLink>
      )}
    </div>
  );
}
