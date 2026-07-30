import React from "react";

import classNames from "../utils/classnames";
import { GhostButton } from "../Button";
import { IconChartColumn, IconPlus } from "../icons";
import { KpiChart } from "./KpiChart";
import { Kpi, KpiCadence } from "./types";

interface KpiCardProps {
  kpis: Kpi[];
  /** Open the detail/log view for a KPI (in-app this would route to the KPI page). */
  onSelectKpi?: (kpiId: string) => void;
  /** Open the "create KPI" flow. */
  onAddKpi?: () => void;
  loading?: boolean;
  testId?: string;
}

const MAX_VISIBLE = 4;

/**
 * The KPIs tool card, matching the fixed-size card pattern used by the other
 * space tools (Tasks/Discussions/Resource Hub) in
 * app/assets/js/features/SpaceTools. Rendered on the space page only when
 * `kpis_enabled` is true.
 */
export function KpiCard({ kpis, onSelectKpi, onAddKpi, loading, testId }: KpiCardProps) {
  const className = classNames(
    "text-xs flex flex-col",
    "w-full h-[380px] max-w-[340px] overflow-hidden",
    "border border-stroke-base bg-surface-base",
    "rounded-lg shadow-sm",
  );

  return (
    <div className={className} data-test-id={testId ?? "kpis-tool"}>
      <Header onAddKpi={onAddKpi} showAdd={!loading && kpis.length > 0} />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : kpis.length === 0 ? (
          <ZeroState onAddKpi={onAddKpi} />
        ) : (
          <div>
            {kpis.slice(0, MAX_VISIBLE).map((kpi) => (
              <KpiRow key={kpi.id} kpi={kpi} onClick={() => onSelectKpi?.(kpi.id)} />
            ))}
            {kpis.length > MAX_VISIBLE && (
              <div className="text-center text-content-subtle py-2">+{kpis.length - MAX_VISIBLE} more</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ onAddKpi, showAdd }: { onAddKpi?: () => void; showAdd: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-stroke-base">
      <div className="flex items-center gap-1.5 font-bold text-sm text-content-base">
        <IconChartColumn size={16} />
        KPIs
      </div>
      {showAdd && onAddKpi && (
        <button
          type="button"
          onClick={onAddKpi}
          className="text-content-dimmed hover:text-content-base transition-colors"
          title="Add KPI"
          data-test-id="add-kpi-header"
        >
          <IconPlus size={16} />
        </button>
      )}
    </div>
  );
}

function KpiRow({ kpi, onClick }: { kpi: Kpi; onClick: () => void }) {
  const latest = React.useMemo(() => {
    if (kpi.dataPoints.length === 0) return undefined;
    return [...kpi.dataPoints].sort((a, b) => a.recordedFor.localeCompare(b.recordedFor)).at(-1);
  }, [kpi.dataPoints]);

  return (
    <button
      type="button"
      onClick={onClick}
      data-test-id={`kpi-row-${kpi.id}`}
      className="w-full text-left px-3 py-2.5 border-b border-stroke-base last:border-b-0 hover:bg-surface-dimmed transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-sm text-content-base truncate">{kpi.name}</div>
          <CadenceBadge cadence={kpi.cadence} />
        </div>
        <div className="text-right flex-shrink-0">
          {latest ? (
            <>
              <div className="font-bold text-sm text-content-base">{formatValue(latest.value, kpi.unit)}</div>
              <div className="text-content-subtle">{latest.recordedFor}</div>
            </>
          ) : (
            <div className="text-content-subtle italic">no data</div>
          )}
        </div>
      </div>

      <div className="mt-2">
        <KpiChart dataPoints={kpi.dataPoints} unit={kpi.unit} width={300} height={48} />
      </div>
    </button>
  );
}

function CadenceBadge({ cadence }: { cadence: KpiCadence }) {
  return (
    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-surface-dimmed text-content-dimmed text-[10px] font-medium uppercase tracking-wide">
      {cadence}
    </span>
  );
}

function ZeroState({ onAddKpi }: { onAddKpi?: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
      <div className="rounded-full bg-surface-dimmed p-3">
        <IconChartColumn size={28} className="text-content-dimmed" />
      </div>
      <div className="text-base font-bold text-content-base">Track KPIs</div>
      <div className="text-sm text-content-dimmed">
        Define the metrics that matter to this space and log values each week or month.
      </div>
      {onAddKpi && (
        <GhostButton size="sm" onClick={onAddKpi} testId="add-first-kpi">
          Add your first KPI
        </GhostButton>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-3 space-y-3" data-test-id="kpis-loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-3 w-1/2 bg-surface-dimmed rounded mb-2" />
          <div className="h-10 w-full bg-surface-dimmed rounded" />
        </div>
      ))}
    </div>
  );
}

function formatValue(v: number, unit: string): string {
  const num = Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (!unit) return num;
  return unit === "$" ? `${unit}${num}` : `${num} ${unit}`;
}
