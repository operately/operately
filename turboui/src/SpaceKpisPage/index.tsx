import React from "react";

import { ErrorCallout } from "../Callouts";
import { PageNew } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import {
  IconChartColumn,
  IconClipboardText,
  IconFolderFilled,
  IconListCheck,
  IconLogs,
  IconTargetArrow,
} from "../icons";

import { KpiDetail } from "./KpiDetail";
import { KpiList } from "./KpiList";
import { LogUpdateForm } from "./LogUpdateForm";
import { NewKpiForm } from "./NewKpiForm";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";

// Space page with the new "KPIs" tab selected. The other tabs are shown to
// demonstrate placement alongside the existing Goals / Projects tabs; only the
// KPIs tab renders content in this POC.
export function SpaceKpisPage(props: SpaceKpisPageNS.Props) {
  const canManage = props.canManage ?? true;

  const [selectedKpiId, setSelectedKpiId] = React.useState<string | null>(props.initialSelectedKpiId ?? null);
  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [logKpiId, setLogKpiId] = React.useState<string | null>(null);

  const tabs = useTabs("kpis", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "goals", label: "Goals", icon: <IconTargetArrow size={14} /> },
    { id: "projects", label: "Projects", icon: <IconListCheck size={14} /> },
    { id: "kpis", label: "KPIs", icon: <IconChartColumn size={14} />, count: props.kpis.length },
    { id: "docs", label: "Docs & Files", icon: <IconFolderFilled size={14} /> },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  const selectedKpi = props.kpis.find((kpi) => kpi.id === selectedKpiId) ?? null;
  const logKpi = props.kpis.find((kpi) => kpi.id === logKpiId) ?? null;

  return (
    <PageNew title={[props.space.name, "KPIs"]} size="fullwidth" testId="space-kpis-page">
      <div className="border-b border-stroke-base px-4 pt-4 sm:px-8">
        <h1 className="text-xl font-bold text-content-accent">{props.space.name}</h1>
        <Tabs tabs={tabs} />
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 overflow-auto px-4 py-8 sm:px-8">
        {tabs.active === "kpis" ? (
          <KpisTabContent
            {...props}
            canManage={canManage}
            selectedKpi={selectedKpi}
            onSelectKpi={setSelectedKpiId}
            onBack={() => setSelectedKpiId(null)}
            onOpenNew={() => setIsNewOpen(true)}
            onOpenLog={setLogKpiId}
          />
        ) : (
          <OtherTabPlaceholder tabId={tabs.active} />
        )}
      </div>

      <NewKpiForm
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        championSearch={props.championSearch}
        onCreate={props.onCreateKpi}
      />

      <LogUpdateForm
        kpi={logKpi}
        isOpen={logKpiId !== null}
        onClose={() => setLogKpiId(null)}
        onRecord={props.onRecordEntry}
      />
    </PageNew>
  );
}

interface KpisTabContentProps extends SpaceKpisPageNS.Props {
  canManage: boolean;
  selectedKpi: SpaceKpisPageNS.Kpi | null;
  onSelectKpi: (id: string) => void;
  onBack: () => void;
  onOpenNew: () => void;
  onOpenLog: (id: string) => void;
}

function KpisTabContent(props: KpisTabContentProps) {
  if (props.loading) {
    return <LoadingState />;
  }

  if (props.error) {
    return <ErrorCallout message="Couldn't load KPIs" description={props.error} testId="kpis-error" />;
  }

  if (props.selectedKpi) {
    return (
      <KpiDetail
        kpi={props.selectedKpi}
        canManage={props.canManage}
        onBack={props.onBack}
        onLogUpdate={() => props.onOpenLog(props.selectedKpi!.id)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-content-accent">Key Performance Indicators</h2>
          <p className="text-sm text-content-dimmed">The numbers this space tracks over time.</p>
        </div>
        {props.canManage && (
          <button
            type="button"
            className="rounded-lg bg-brand-1 px-3 py-1.5 text-sm font-medium text-white-1 hover:bg-blue-600"
            onClick={props.onOpenNew}
            data-test-id="new-kpi"
          >
            New KPI
          </button>
        )}
      </div>

      <KpiList
        kpis={props.kpis}
        canManage={props.canManage}
        onSelect={props.onSelectKpi}
        onLogUpdate={props.onOpenLog}
        onNewKpi={props.onOpenNew}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" data-test-id="kpis-loading">
      <div className="h-9 w-48 animate-pulse rounded-md bg-surface-dimmed" />
      <div className="overflow-hidden rounded-lg border border-stroke-base">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-stroke-dimmed p-4 last:border-b-0">
            <div className="h-4 flex-1 animate-pulse rounded bg-surface-dimmed" />
            <div className="h-4 w-20 animate-pulse rounded bg-surface-dimmed" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-surface-dimmed" />
            <div className="h-4 w-16 animate-pulse rounded bg-surface-dimmed" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OtherTabPlaceholder({ tabId }: { tabId: string }) {
  return (
    <div className="rounded-lg border border-dashed border-surface-outline bg-surface-dimmed px-6 py-16 text-center text-sm text-content-dimmed">
      The <span className="font-medium capitalize text-content-base">{tabId}</span> tab is out of scope for this KPIs
      proof of concept. Switch back to the <span className="font-medium text-content-base">KPIs</span> tab.
    </div>
  );
}
