import React from "react";

import { ErrorCallout } from "../Callouts";
import { BlackLink } from "../Link";
import { PageNew } from "../Page";
import type { Navigation } from "../Page/Navigation";
import { TextField } from "../TextField";
import { IconChartColumn, IconChevronRight } from "../icons";

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

  // The KPI on display is decided by the route, not by page state: each KPI has
  // its own page, so opening one is a navigation and its data (including the
  // entries the list omits) arrives with the route.
  const selectedKpi = props.selectedKpi ?? null;

  // The open KPI's fields are edited in place — in the page title and the
  // sidebar — so they are held here and shared by both.
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
        openKpi={openKpi}
        canManage={canManage}
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
  openKpi: KpiFields | null;
  canManage: boolean;
  primaryAction: HeaderAction | null;
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

        {props.openKpi ? (
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
        <div className="flex min-w-0 items-center gap-2">
          <IconChartColumn size={20} className="shrink-0 text-content-dimmed" />
          <Title openKpi={props.openKpi} canManage={props.canManage} />
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
        </div>
      </div>
    </header>
  );
}

const titleClass = "text-sm font-bold text-content-accent sm:text-base";

// A KPI is renamed where its name is read — in the page title — the way a task
// is renamed on its own page. The editable field cannot live inside a heading
// element, so the role is set on its container to keep the page's heading.
function Title({ openKpi, canManage }: { openKpi: KpiFields | null; canManage: boolean }) {
  if (!openKpi) {
    return <h1 className={titleClass}>KPIs</h1>;
  }

  return (
    <div role="heading" aria-level={1} className="min-w-0">
      <TextField
        className={titleClass}
        text={openKpi.name}
        onChange={(name) => openKpi.update({ name })}
        readonly={!canManage}
        trimBeforeSave
        testId="kpi-name"
      />
    </div>
  );
}

interface KpisContentProps extends SpaceKpisPageNS.Props {
  canManage: boolean;
  selectedKpi: SpaceKpisPageNS.Kpi | null;
  openKpi: KpiFields | null;
  onOpenNew: () => void;
  onOpenDelete: () => void;
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
