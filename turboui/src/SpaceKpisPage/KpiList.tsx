import React from "react";

import { Avatar } from "../Avatar";
import { DivLink } from "../Link";
import { IconChartColumn } from "../icons";
import { KpiSparkline } from "./KpiSparkline";
import type { SpaceKpisPage } from "./types";
import { formatNumber, formatValue, latestEntry, latestTrend } from "./utils";
import { TrendIndicator } from "./TrendIndicator";

interface KpiListProps {
  kpis: SpaceKpisPage.Kpi[];
  canManage: boolean;
  onNewKpi: () => void;
}

// Shared by the header and every row so columns stay aligned without a <table>
// (a table row cannot be an <a>, and we want the whole line to be the link).
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_14rem_8rem_11rem] items-center";

export function KpiList({ kpis, canManage, onNewKpi }: KpiListProps) {
  if (kpis.length === 0) {
    return <EmptyState canManage={canManage} onNewKpi={onNewKpi} />;
  }

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-stroke-base" data-test-id="kpi-list">
      <div className="text-sm">
        <div
          className={`${ROW_GRID} border-b border-stroke-base bg-surface-dimmed text-left text-xs uppercase tracking-wide text-content-dimmed`}
        >
          <div className="px-4 py-2 font-medium">KPI</div>
          <div className="px-4 py-2 font-medium">Champion</div>
          <div className="px-4 py-2 font-medium">History</div>
          <div className="px-4 py-2 text-right font-medium">Latest value</div>
        </div>

        {kpis.map((kpi) => (
          <KpiRow key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}

function KpiRow({ kpi }: { kpi: SpaceKpisPage.Kpi }) {
  const latest = latestEntry(kpi);
  const trend = latestTrend(kpi);

  return (
    <DivLink
      to={kpi.link}
      testId={`kpi-row-${kpi.id}`}
      className={`${ROW_GRID} cursor-pointer border-b border-stroke-dimmed last:border-b-0 hover:bg-surface-highlight`}
    >
      <div className="truncate px-4 py-3 text-content-accent" data-test-id={`kpi-link-${kpi.id}`}>
        {kpi.name}
      </div>

      <div className="truncate whitespace-nowrap px-4 py-3">
        {kpi.champion ? (
          <div className="flex items-center gap-2">
            <Avatar person={kpi.champion} size="tiny" />
            <span className="truncate text-content-base">{kpi.champion.fullName}</span>
          </div>
        ) : (
          <span className="text-content-subtle">Unassigned</span>
        )}
      </div>

      <div className="px-4 py-3">
        <KpiSparkline entries={kpi.entries} width={112} testId={`kpi-sparkline-${kpi.id}`} />
      </div>

      <div className="whitespace-nowrap px-4 py-3 text-right">
        {latest ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-content-accent">
              {kpi.unit === "%" ? formatValue(latest.value, "%") : formatNumber(latest.value)}
            </span>
            <TrendIndicator delta={trend} />
          </div>
        ) : (
          <span className="text-content-subtle">No data</span>
        )}
      </div>
    </DivLink>
  );
}

function EmptyState({ canManage, onNewKpi }: { canManage: boolean; onNewKpi: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-outline bg-surface-dimmed px-6 py-16 text-center"
      data-test-id="kpi-list-empty"
    >
      <IconChartColumn size={40} className="text-content-subtle" />
      <h3 className="mt-4 font-bold text-content-accent">No KPIs yet</h3>
      <p className="mt-1 max-w-sm text-sm text-content-dimmed">
        Track key metrics for this space and record updates over time.
      </p>
      {canManage && (
        <button
          type="button"
          className="mt-4 rounded-lg bg-brand-1 px-3 py-1.5 text-sm font-medium text-white-1 hover:bg-blue-600"
          onClick={onNewKpi}
          data-test-id="empty-new-kpi"
        >
          Add the first KPI
        </button>
      )}
    </div>
  );
}
