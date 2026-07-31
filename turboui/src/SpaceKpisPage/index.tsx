import React from "react";

import { ErrorCallout } from "../Callouts";
import { BlackLink } from "../Link";
import { PageNew } from "../Page";
import type { Navigation } from "../Page/Navigation";
import { IconChartColumn, IconChevronRight } from "../icons";

import { KpiDetail } from "./KpiDetail";
import { KpiList } from "./KpiList";
import { LogUpdateForm } from "./LogUpdateForm";
import { NewKpiForm } from "./NewKpiForm";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";

// The KPIs tool for a space. The page chrome (fullwidth PageNew + breadcrumb
// header + tool title) mirrors the other space tools such as the Work Map and
// Tasks/Kanban pages so the experience feels consistent across a space.
export function SpaceKpisPage(props: SpaceKpisPageNS.Props) {
  const canManage = props.canManage ?? true;

  const [selectedKpiId, setSelectedKpiId] = React.useState<string | null>(props.initialSelectedKpiId ?? null);
  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [logKpiId, setLogKpiId] = React.useState<string | null>(null);

  const selectedKpi = props.kpis.find((kpi) => kpi.id === selectedKpiId) ?? null;
  const logKpi = props.kpis.find((kpi) => kpi.id === logKpiId) ?? null;

  const contentReady = !props.loading && !props.error;

  // The primary header action mirrors what the visible content offers: "New KPI"
  // in the list view, "Log update" when a single KPI is open.
  let primaryAction: HeaderAction | null = null;
  if (canManage && contentReady) {
    if (selectedKpi) {
      primaryAction = { label: "Log update", onClick: () => setLogKpiId(selectedKpi.id), testId: "kpi-detail-log-update" };
    } else {
      primaryAction = { label: "New KPI", onClick: () => setIsNewOpen(true), testId: "new-kpi" };
    }
  }

  return (
    <PageNew title={[props.space.name, "KPIs"]} size="fullwidth" testId="space-kpis-page">
      <PageHeader
        navigation={props.navigation}
        selectedKpiName={selectedKpi?.name ?? null}
        primaryAction={primaryAction}
        onBackToList={() => setSelectedKpiId(null)}
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          <KpisContent
            {...props}
            canManage={canManage}
            selectedKpi={selectedKpi}
            onSelectKpi={setSelectedKpiId}
            onOpenNew={() => setIsNewOpen(true)}
            onOpenLog={setLogKpiId}
          />
        </div>
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

interface HeaderAction {
  label: string;
  onClick: () => void;
  testId: string;
}

interface PageHeaderProps {
  navigation: Navigation.Item[];
  selectedKpiName: string | null;
  primaryAction: HeaderAction | null;
  onBackToList: () => void;
}

// Breadcrumb + title header shared visual language with the Work Map / Tasks
// tools. When a KPI is open, the tool title becomes a breadcrumb back to the
// list and the KPI name is shown as the current crumb.
function PageHeader(props: PageHeaderProps) {
  return (
    <header className="border-b border-surface-outline px-4 py-3">
      <nav className="mt-1 flex items-center gap-0.5" aria-label="Breadcrumb">
        {props.navigation.map((item, index) => (
          <React.Fragment key={index}>
            <BlackLink to={item.to} className="text-xs leading-snug text-content-dimmed" underline="hover">
              {item.label}
            </BlackLink>
            <IconChevronRight size={10} className="text-content-dimmed" />
          </React.Fragment>
        ))}

        {props.selectedKpiName ? (
          <button
            type="button"
            className="text-xs leading-snug text-content-dimmed hover:underline"
            onClick={props.onBackToList}
            data-test-id="kpis-breadcrumb"
          >
            KPIs
          </button>
        ) : (
          <span className="text-xs leading-snug text-content-dimmed">KPIs</span>
        )}
      </nav>

      <div className="mt-1 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <IconChartColumn size={20} className="text-content-dimmed" />
          <h1 className="text-sm font-bold text-content-accent sm:text-base">
            {props.selectedKpiName ?? "KPIs"}
          </h1>
        </div>

        {props.primaryAction && (
          <button
            type="button"
            className="rounded-lg bg-brand-1 px-3 py-1.5 text-sm font-medium text-white-1 hover:bg-blue-600"
            onClick={props.primaryAction.onClick}
            data-test-id={props.primaryAction.testId}
          >
            {props.primaryAction.label}
          </button>
        )}
      </div>
    </header>
  );
}

interface KpisContentProps extends SpaceKpisPageNS.Props {
  canManage: boolean;
  selectedKpi: SpaceKpisPageNS.Kpi | null;
  onSelectKpi: (id: string) => void;
  onOpenNew: () => void;
  onOpenLog: (id: string) => void;
}

function KpisContent(props: KpisContentProps) {
  if (props.loading) {
    return <LoadingState />;
  }

  if (props.error) {
    return <ErrorCallout message="Couldn't load KPIs" description={props.error} testId="kpis-error" />;
  }

  if (props.selectedKpi) {
    return <KpiDetail kpi={props.selectedKpi} />;
  }

  return (
    <KpiList
      kpis={props.kpis}
      canManage={props.canManage}
      onSelect={props.onSelectKpi}
      onLogUpdate={props.onOpenLog}
      onNewKpi={props.onOpenNew}
    />
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
