import React from "react";

import { ErrorCallout } from "../Callouts";
import { BlackLink } from "../Link";
import { PageNew } from "../Page";
import type { Navigation } from "../Page/Navigation";
import { IconChartColumn, IconChevronRight } from "../icons";

import { AnnotationForm } from "./AnnotationForm";
import { DeleteKpiModal } from "./DeleteKpiModal";
import { KpiDetail } from "./KpiDetail";
import { KpiList } from "./KpiList";
import { LogUpdateForm } from "./LogUpdateForm";
import { NewKpiModal } from "./NewKpiModal";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";
import { useKpiFields, type KpiFields } from "./useKpiFields";

// The KPIs tool for a space. The page chrome (fullwidth PageNew + breadcrumb
// header + tool title) mirrors the other space tools such as the Work Map and
// Tasks/Kanban pages so the experience feels consistent across a space.
export function SpaceKpisPage(props: SpaceKpisPageNS.Props) {
  const canManage = props.canManage ?? true;

  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [logKpiId, setLogKpiId] = React.useState<string | null>(null);
  const [annotationState, setAnnotationState] = React.useState<{
    kpi: SpaceKpisPageNS.Kpi;
    annotation: SpaceKpisPageNS.KpiAnnotation | null;
  } | null>(null);

  // The KPI on display is decided by the route, not by page state: each KPI has
  // its own page, so opening one is a navigation and its data (including the
  // entries the list omits) arrives with the route.
  const selectedKpi = props.selectedKpi ?? null;

  // The open KPI's fields are edited in place — its name above the description,
  // the rest in the sidebar — so they are held here and shared by both.
  const openKpi = useKpiFields(selectedKpi, props.onEditKpi);

  // An update is logged from the open KPI's page, whose permalink may be opened
  // before the list is browsed.
  const logKpi = (() => {
    if (!logKpiId) return null;
    if (selectedKpi?.id === logKpiId) return selectedKpi;

    return props.kpis.find((kpi) => kpi.id === logKpiId) ?? null;
  })();

  const contentReady = !props.loading && !props.error;

  // The primary header action mirrors what the visible content offers: "New KPI"
  // in the list view, "Log update" when a single KPI is open.
  let primaryAction: HeaderAction | null = null;
  if (canManage && contentReady) {
    if (selectedKpi) {
      primaryAction = {
        label: "Log update",
        onClick: () => setLogKpiId(selectedKpi.id),
        testId: "kpi-detail-log-update",
      };
    } else {
      primaryAction = { label: "New KPI", onClick: () => setIsNewOpen(true), testId: "new-kpi" };
    }
  }

  // A KPI's own page is bookmarkable, so name it after the KPI.
  const title = openKpi ? [openKpi.name, props.space.name] : [props.space.name, "KPIs"];

  return (
    <PageNew title={title} size="fullwidth" testId="space-kpis-page">
      <PageHeader
        navigation={props.navigation}
        kpisLink={props.kpisLink}
        isKpiOpen={openKpi !== null}
        primaryAction={primaryAction}
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <KpisContent
            {...props}
            canManage={canManage}
            selectedKpi={selectedKpi}
            openKpi={openKpi}
            onOpenNew={() => setIsNewOpen(true)}
            onOpenDelete={() => setIsDeleteOpen(true)}
            onOpenNewAnnotation={() => selectedKpi && setAnnotationState({ kpi: selectedKpi, annotation: null })}
            onOpenAnnotation={(annotation) => selectedKpi && setAnnotationState({ kpi: selectedKpi, annotation })}
          />
        </div>
      </div>

      <NewKpiModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        championSearch={props.championSearch}
        onCreate={props.onCreateKpi}
      />

      <DeleteKpiModal
        kpi={selectedKpi}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDelete={props.onDeleteKpi}
      />

      <LogUpdateForm
        kpi={logKpi}
        isOpen={logKpiId !== null}
        onClose={() => setLogKpiId(null)}
        onRecord={props.onRecordEntry}
        richTextHandlers={props.richTextHandlers}
      />

      <AnnotationForm
        kpi={annotationState?.kpi ?? null}
        annotation={annotationState?.annotation ?? null}
        isOpen={annotationState !== null}
        onClose={() => setAnnotationState(null)}
        onCreate={props.onAddAnnotation}
        onEdit={props.onEditAnnotation}
        onDelete={props.onDeleteAnnotation}
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
  kpisLink: string;
  isKpiOpen: boolean;
  primaryAction: HeaderAction | null;
}

// Breadcrumb + title header shared visual language with the Work Map / Tasks
// tools. On a KPI's own page the name leads the content instead (see
// KpiDetail), so the header collapses to the trail back to the list with the
// page action beside it.
function PageHeader(props: PageHeaderProps) {
  if (props.isKpiOpen) {
    return (
      <header className="border-b border-surface-outline px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs navigation={props.navigation} kpisLink={props.kpisLink} isKpiOpen />
          <PrimaryAction action={props.primaryAction} />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-surface-outline px-4 py-3">
      <Breadcrumbs navigation={props.navigation} kpisLink={props.kpisLink} isKpiOpen={false} />

      <div className="mt-1 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <IconChartColumn size={20} className="shrink-0 text-content-dimmed" />
          <h1 className="text-sm font-bold text-content-accent sm:text-base">KPIs</h1>
        </div>

        <PrimaryAction action={props.primaryAction} />
      </div>
    </header>
  );
}

function Breadcrumbs({
  navigation,
  kpisLink,
  isKpiOpen,
}: {
  navigation: Navigation.Item[];
  kpisLink: string;
  isKpiOpen: boolean;
}) {
  return (
    <nav className="mt-1 flex min-w-0 items-center gap-0.5" aria-label="Breadcrumb">
      {navigation.map((item, index) => (
        <React.Fragment key={index}>
          <BlackLink to={item.to} className="text-xs leading-snug text-content-dimmed" underline="hover">
            {item.label}
          </BlackLink>
          <IconChevronRight size={10} className="text-content-dimmed" />
        </React.Fragment>
      ))}

      {isKpiOpen ? (
        <BlackLink
          to={kpisLink}
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
  );
}

function PrimaryAction({ action }: { action: HeaderAction | null }) {
  if (!action) return null;

  return (
    <button
      type="button"
      className="shrink-0 rounded-lg bg-brand-1 px-3 py-1.5 text-sm font-medium text-white-1 hover:bg-blue-600"
      onClick={action.onClick}
      data-test-id={action.testId}
    >
      {action.label}
    </button>
  );
}

interface KpisContentProps extends SpaceKpisPageNS.Props {
  canManage: boolean;
  selectedKpi: SpaceKpisPageNS.Kpi | null;
  openKpi: KpiFields | null;
  onOpenNew: () => void;
  onOpenDelete: () => void;
  onOpenNewAnnotation: () => void;
  onOpenAnnotation: (annotation: SpaceKpisPageNS.KpiAnnotation) => void;
}

function KpisContent(props: KpisContentProps) {
  const { selectedKpi, openKpi } = props;

  if (props.loading) {
    return <LoadingState />;
  }

  if (props.error) {
    return <ErrorCallout message="Couldn't load KPIs" description={props.error} testId="kpis-error" />;
  }

  if (selectedKpi && openKpi) {
    return (
      <KpiDetail
        kpi={selectedKpi}
        fields={openKpi}
        canManage={props.canManage}
        canComment={props.canComment}
        championSearch={props.championSearch}
        onDescriptionChange={props.onDescriptionChange}
        onOpenNewAnnotation={props.onOpenNewAnnotation}
        onOpenAnnotation={props.onOpenAnnotation}
        onDelete={props.onOpenDelete}
        richTextHandlers={props.richTextHandlers}
        renderEntryComments={props.renderEntryComments}
        subscriptions={props.subscriptions}
      />
    );
  }

  return <KpiList kpis={props.kpis} canManage={props.canManage} onNewKpi={props.onOpenNew} />;
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
