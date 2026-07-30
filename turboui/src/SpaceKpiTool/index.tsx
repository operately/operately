import React from "react";

import { PrimaryButton } from "../Button";
import { SwitchToggle } from "../SwitchToggle";
import { Modal } from "../Modal";
import { InfoCallout } from "../Callouts";
import { IconChartColumn, IconPlus } from "../icons";

import { KpiCard } from "./KpiCard";
import { KpiChart } from "./KpiChart";
import { CreateKpiForm } from "./CreateKpiForm";
import { LogDataPointForm } from "./LogDataPointForm";
import { AddKpiDataPointInput, CreateKpiInput, Kpi } from "./types";

export { KpiCard } from "./KpiCard";
export { KpiChart } from "./KpiChart";
export { CreateKpiForm } from "./CreateKpiForm";
export { LogDataPointForm } from "./LogDataPointForm";
export type { Kpi, KpiDataPoint, KpiCadence, CreateKpiInput, AddKpiDataPointInput } from "./types";

interface SpaceKpiToolProps {
  /** Whether KPIs are enabled for this space (`SpaceTools.kpis_enabled`). */
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;

  kpis: Kpi[];

  /** Whether the current viewer can edit (gates create/log actions). */
  canEdit?: boolean;
  loading?: boolean;

  onCreateKpi: (input: CreateKpiInput) => Promise<void>;
  onAddDataPoint: (input: AddKpiDataPointInput) => Promise<void>;
}

/**
 * Interactive playground that stitches the KPI space-tool POC together so it can
 * be demoed end-to-end in Storybook:
 *
 *   toggle `kpis_enabled` -> card renders -> create a KPI -> log data points ->
 *   chart updates -> duplicate periods are rejected.
 *
 * In production these pieces would live across the space configuration page and
 * the space page (ToolsSection). Here they are colocated for review.
 */
export function SpaceKpiTool(props: SpaceKpiToolProps) {
  const [creating, setCreating] = React.useState(false);
  const [loggingFor, setLoggingFor] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const canEdit = props.canEdit ?? true;
  const selected = props.kpis.find((k) => k.id === selectedId) ?? null;
  const loggingKpi = props.kpis.find((k) => k.id === loggingFor) ?? null;

  const handleCreate = async (input: CreateKpiInput) => {
    await props.onCreateKpi(input);
    setCreating(false);
  };

  const handleLog = async (input: AddKpiDataPointInput) => {
    await props.onAddDataPoint(input);
    setLoggingFor(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <ConfigRow enabled={props.enabled} onToggle={props.onToggleEnabled} />

      {props.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <SectionLabel>Space page card</SectionLabel>
            <div className="flex justify-center">
              <KpiCard
                kpis={props.kpis}
                loading={props.loading}
                onSelectKpi={(id) => setSelectedId(id)}
                onAddKpi={canEdit ? () => setCreating(true) : undefined}
              />
            </div>
          </div>

          <div>
            <SectionLabel>Detail</SectionLabel>
            {selected ? (
              <KpiDetail kpi={selected} canEdit={canEdit} onLog={() => setLoggingFor(selected.id)} />
            ) : (
              <div className="border border-dashed border-stroke-base rounded-lg p-8 text-center text-content-dimmed text-sm">
                Select a KPI from the card to see its full chart and data points.
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={creating} onClose={() => setCreating(false)} title="Create KPI" size="small">
        <CreateKpiForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal isOpen={!!loggingKpi} onClose={() => setLoggingFor(null)} title="Log data point" size="small">
        {loggingKpi && <LogDataPointForm kpi={loggingKpi} onSubmit={handleLog} onCancel={() => setLoggingFor(null)} />}
      </Modal>
    </div>
  );
}

function ConfigRow({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-8 border border-stroke-base rounded-lg p-4 bg-surface-base">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-surface-dimmed p-2">
          <IconChartColumn size={20} className="text-content-dimmed" />
        </div>
        <div>
          <div className="text-base font-bold text-content-base">KPIs</div>
          <div className="text-sm text-content-dimmed max-w-md">
            Track the metrics that matter to this space and log values on a weekly or monthly cadence.
          </div>
        </div>
      </div>
      <SwitchToggle label="Enable KPIs" labelHidden value={enabled} setValue={onToggle} testId="kpis-enabled-toggle" />
    </div>
  );
}

function KpiDetail({ kpi, canEdit, onLog }: { kpi: Kpi; canEdit: boolean; onLog: () => void }) {
  const rows = React.useMemo(
    () => [...kpi.dataPoints].sort((a, b) => b.recordedFor.localeCompare(a.recordedFor)),
    [kpi.dataPoints],
  );

  return (
    <div className="border border-stroke-base rounded-lg bg-surface-base overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-stroke-base">
        <div>
          <div className="font-bold text-lg text-content-base">{kpi.name}</div>
          <div className="text-xs text-content-dimmed">
            {kpi.cadence} · unit: {kpi.unit || "—"}
            {kpi.creator ? ` · created by ${kpi.creator}` : ""}
          </div>
        </div>
        {canEdit && (
          <PrimaryButton size="xs" onClick={onLog} testId="open-log-data-point">
            <span className="flex items-center gap-1">
              <IconPlus size={14} /> Log
            </span>
          </PrimaryButton>
        )}
      </div>

      <div className="p-4">
        <KpiChart dataPoints={kpi.dataPoints} unit={kpi.unit} width={460} height={180} detailed />
      </div>

      {rows.length === 0 ? (
        <div className="px-4 pb-4">
          <InfoCallout message="No data points yet. Log your first value to start the chart." />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-content-subtle text-xs uppercase tracking-wide border-t border-stroke-base">
              <th className="text-left font-medium px-4 py-2">Period</th>
              <th className="text-right font-medium px-4 py-2">Value</th>
              <th className="text-left font-medium px-4 py-2">Logged by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((dp) => (
              <tr key={dp.id} className="border-t border-stroke-base">
                <td className="px-4 py-2 text-content-base">{dp.recordedFor}</td>
                <td className="px-4 py-2 text-right font-medium text-content-base">
                  {kpi.unit === "$"
                    ? `$${dp.value.toLocaleString()}`
                    : `${dp.value.toLocaleString()}${kpi.unit ? ` ${kpi.unit}` : ""}`}
                </td>
                <td className="px-4 py-2 text-content-dimmed">{dp.insertedBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wide font-bold text-content-subtle mb-2">{children}</div>;
}
