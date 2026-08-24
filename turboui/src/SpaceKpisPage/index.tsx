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

  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [logKpiId, setLogKpiId] = React.useState<string | null>(null);
  const [editKpiId, setEditKpiId] = React.useState<string | null>(null);
  const [deleteKpiId, setDeleteKpiId] = React.useState<string | null>(null);

  // The KPI on display is decided by the route, not by page state: each KPI has
  // its own page, so opening one is a navigation and its data (including the
  // entries the list omits) arrives with the route.
  const selectedKpi = props.selectedKpi ?? null;

  // Modals act on KPIs from the list, or on the open KPI when its page is shown
  // directly (its permalink may be opened before the list is browsed).
  const findKpi = (kpiId: string | null) => {
    if (!kpiId) return null;
    if (selectedKpi?.id === kpiId) return selectedKpi;

    return props.kpis.find((kpi) => kpi.id === kpiId) ?? null;
  };

  const logKpi = findKpi(logKpiId);
  const editKpi = findKpi(editKpiId);
  const deleteKpi = findKpi(deleteKpiId);

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

  // A KPI's own page is bookmarkable, so name it after the KPI.
  const title = selectedKpi ? [selectedKpi.name, props.space.name] : [props.space.name, "KPIs"];

  return (
    <PageNew title={title} size="fullwidth" testId="space-kpis-page">
      <PageHeader
        navigation={props.navigation}
        kpisLink={props.kpisLink}
        selectedKpiName={selectedKpi?.name ?? null}
        primaryAction={primaryAction}
        kpiActions={headerKpiActions}
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          <KpisContent
            {...props}
            canManage={canManage}
            selectedKpi={selectedKpi}
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
  kpisLink: string;
  selectedKpiName: string | null;
  primaryAction: HeaderAction | null;
  kpiActions: HeaderKpiActions | null;
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
          <BlackLink
            to={props.kpisLink}
            className="text-xs leading-snug text-content-dimmed"
            underline="hover"
            testId="kpis-breadcrumb"
          >
            KPIs
          </BlackLink>
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
