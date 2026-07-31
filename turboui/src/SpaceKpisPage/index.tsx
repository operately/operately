import React from "react";

import { ErrorCallout } from "../Callouts";
import { BlackLink } from "../Link";
import { PageNew } from "../Page";
import type { Navigation } from "../Page/Navigation";
import { IconChartColumn, IconChevronRight } from "../icons";

import { DeleteKpiModal } from "./DeleteKpiModal";
import { KpiActionsMenu } from "./KpiActionsMenu";
import { KpiDetail } from "./KpiDetail";
import { KpiFormModal } from "./KpiFormModal";
import { KpiList } from "./KpiList";
import { LogUpdateForm } from "./LogUpdateForm";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";

// The KPIs tool for a space. The page chrome (fullwidth PageNew + breadcrumb
// header + tool title) mirrors the other space tools such as the Work Map and
// Tasks/Kanban pages so the experience feels consistent across a space.
export function SpaceKpisPage(props: SpaceKpisPageNS.Props) {
  const canManage = props.canManage ?? true;

  const [selectedKpiId, setSelectedKpiId] = React.useState<string | null>(props.initialSelectedKpiId ?? null);
  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [logKpiId, setLogKpiId] = React.useState<string | null>(null);
  const [editKpiId, setEditKpiId] = React.useState<string | null>(null);
  const [deleteKpiId, setDeleteKpiId] = React.useState<string | null>(null);

  const selectedKpi = props.kpis.find((kpi) => kpi.id === selectedKpiId) ?? null;
  const logKpi = props.kpis.find((kpi) => kpi.id === logKpiId) ?? null;
  const editKpi = props.kpis.find((kpi) => kpi.id === editKpiId) ?? null;
  const deleteKpi = props.kpis.find((kpi) => kpi.id === deleteKpiId) ?? null;

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

  // Edit/Delete for the open KPI live in an overflow menu beside the primary
  // header action, so the detail view offers the same manage actions as the list.
  const headerKpiActions =
    canManage && contentReady && selectedKpi
      ? {
          kpiId: selectedKpi.id,
          onEdit: () => setEditKpiId(selectedKpi.id),
          onDelete: () => setDeleteKpiId(selectedKpi.id),
        }
      : null;

  return (
    <PageNew title={[props.space.name, "KPIs"]} size="fullwidth" testId="space-kpis-page">
      <PageHeader
        navigation={props.navigation}
        selectedKpiName={selectedKpi?.name ?? null}
        primaryAction={primaryAction}
        kpiActions={headerKpiActions}
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
            onOpenEdit={setEditKpiId}
            onOpenDelete={setDeleteKpiId}
          />
        </div>
      </div>

      {/* New KPI */}
      <KpiFormModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        championSearch={props.championSearch}
        onCreate={props.onCreateKpi}
        onEdit={props.onEditKpi}
      />

      {/* Edit KPI — keyed by id so the form re-initialises for each KPI. */}
      <KpiFormModal
        key={editKpi?.id ?? "edit-kpi"}
        isOpen={editKpiId !== null}
        onClose={() => setEditKpiId(null)}
        championSearch={props.championSearch}
        kpi={editKpi}
        onCreate={props.onCreateKpi}
        onEdit={props.onEditKpi}
      />

      <DeleteKpiModal
        kpi={deleteKpi}
        isOpen={deleteKpiId !== null}
        onClose={() => setDeleteKpiId(null)}
        onDelete={props.onDeleteKpi}
        onDeleted={() => {
          // If we deleted the KPI currently open in the detail view, fall back
          // to the list since the detail can no longer be shown.
          if (selectedKpiId === deleteKpiId) setSelectedKpiId(null);
        }}
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

interface HeaderKpiActions {
  kpiId: string;
  onEdit: () => void;
  onDelete: () => void;
}

interface PageHeaderProps {
  navigation: Navigation.Item[];
  selectedKpiName: string | null;
  primaryAction: HeaderAction | null;
  kpiActions: HeaderKpiActions | null;
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

        <div className="flex items-center gap-1.5">
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

          {props.kpiActions && (
            <KpiActionsMenu
              kpiId={props.kpiActions.kpiId}
              onEdit={props.kpiActions.onEdit}
              onDelete={props.kpiActions.onDelete}
            />
          )}
        </div>
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
  onOpenEdit: (id: string) => void;
  onOpenDelete: (id: string) => void;
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
      onEdit={props.onOpenEdit}
      onDelete={props.onOpenDelete}
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
