import React from "react";

import { Avatar } from "../Avatar";
import { IconChartColumn, IconDots } from "../icons";
import { KpiActionsMenu } from "./KpiActionsMenu";
import type { SpaceKpisPage } from "./types";
import { formatCadence, formatValue, latestEntry, latestTrend } from "./utils";
import { TrendIndicator } from "./TrendIndicator";

interface KpiListProps {
  kpis: SpaceKpisPage.Kpi[];
  canManage: boolean;
  onSelect: (kpiId: string) => void;
  onLogUpdate: (kpiId: string) => void;
  onNewKpi: () => void;
  onEdit: (kpiId: string) => void;
  onDelete: (kpiId: string) => void;
}

export function KpiList({ kpis, canManage, onSelect, onLogUpdate, onNewKpi, onEdit, onDelete }: KpiListProps) {
  if (kpis.length === 0) {
    return <EmptyState canManage={canManage} onNewKpi={onNewKpi} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stroke-base" data-test-id="kpi-list">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stroke-base bg-surface-dimmed text-left text-xs uppercase tracking-wide text-content-dimmed">
            <th className="px-4 py-2 font-medium">KPI</th>
            <th className="px-4 py-2 font-medium">Cadence</th>
            <th className="px-4 py-2 font-medium">Champion</th>
            <th className="px-4 py-2 text-right font-medium">Latest value</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {kpis.map((kpi) => (
            <KpiRow
              key={kpi.id}
              kpi={kpi}
              canManage={canManage}
              onSelect={() => onSelect(kpi.id)}
              onLogUpdate={() => onLogUpdate(kpi.id)}
              onEdit={() => onEdit(kpi.id)}
              onDelete={() => onDelete(kpi.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KpiRow({
  kpi,
  canManage,
  onSelect,
  onLogUpdate,
  onEdit,
  onDelete,
}: {
  kpi: SpaceKpisPage.Kpi;
  canManage: boolean;
  onSelect: () => void;
  onLogUpdate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const latest = latestEntry(kpi);
  const trend = latestTrend(kpi);

  return (
    <tr
      className="group cursor-pointer border-b border-stroke-dimmed last:border-b-0 hover:bg-surface-highlight"
      onClick={onSelect}
      data-test-id={`kpi-row-${kpi.id}`}
    >
      <td className="px-4 py-3">
        <div className="font-semibold text-content-accent group-hover:underline">{kpi.name}</div>
        <div className="text-xs text-content-dimmed">Measured in {kpi.unit}</div>
      </td>

      <td className="px-4 py-3 text-content-base">{formatCadence(kpi.cadence)}</td>

      <td className="px-4 py-3">
        {kpi.champion ? (
          <div className="flex items-center gap-2">
            <Avatar person={kpi.champion} size="tiny" />
            <span className="text-content-base">{kpi.champion.fullName}</span>
          </div>
        ) : (
          <span className="text-content-subtle">Unassigned</span>
        )}
      </td>

      <td className="px-4 py-3 text-right">
        {latest ? (
          <div className="flex items-center justify-end gap-2">
            <span className="font-semibold text-content-accent">{formatValue(latest.value, kpi.unit)}</span>
            <TrendIndicator delta={trend} />
          </div>
        ) : (
          <span className="text-content-subtle">No data</span>
        )}
      </td>

      <td className="px-4 py-3 text-right">
        {canManage && (
          // Stop row-selection navigation when interacting with the actions.
          <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium text-link-base opacity-0 transition-opacity hover:bg-surface-accent group-hover:opacity-100"
              onClick={onLogUpdate}
              data-test-id={`log-update-${kpi.id}`}
            >
              Log update
            </button>

            <KpiActionsMenu
              kpiId={kpi.id}
              onEdit={onEdit}
              onDelete={onDelete}
              customTrigger={
                <button
                  type="button"
                  aria-label="KPI actions"
                  className="rounded-md p-1 text-content-dimmed opacity-0 transition-opacity hover:bg-surface-accent hover:text-content-base group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <IconDots size={18} />
                </button>
              }
            />
          </div>
        )}
      </td>
    </tr>
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
