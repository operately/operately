import React from "react";

import { FormattedTime } from "../FormattedTime";
import { IconDownload } from "../icons";
import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";
import { ProgressBar } from "../ProgressBar";
import { Tooltip } from "../Tooltip";
import classNames from "../utils/classnames";

export namespace CompanyExportPage {
  export interface Run {
    id: string;
    status: string;
    currentStep?: string | null;
    percentage?: number | null;
    tablesCount?: number | null;
    rowsCount?: number | null;
    errorMessage?: string | null;
    insertedAt: string;
    completedAt?: string | null;
  }

  export interface Props {
    runs: Run[];
    starting: boolean;
    downloading: string | null;
    backPath: string;
    onStartExport: () => void | Promise<void>;
    onDownload: (runId: string) => void | Promise<void>;
  }
}

export function CompanyExportPage(props: CompanyExportPage.Props) {
  const navigation = React.useMemo(() => [{ to: props.backPath, label: "Back to Company Admin" }], [props.backPath]);

  return (
    <Page title="Export Company" size="small" testId="company-export-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="uppercase text-sm tracking-wide">Company Export</div>
            <h1 className="text-content-accent text-3xl font-extrabold">Export company data</h1>
            <p className="mt-2 text-content-dimmed">
              Export all data from this company as a ZIP package with the company data and related files.
            </p>
          </div>

          <PrimaryButton size="sm" onClick={props.onStartExport} loading={props.starting} testId="start-export-button">
            Start export
          </PrimaryButton>
        </header>

        <section className="mt-10">
          <h2 className="font-bold">Exports</h2>

          {props.runs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3 mt-3">
              {props.runs.map((run, index) => (
                <ExportRunCard
                  key={run.id}
                  run={run}
                  latest={index === 0}
                  downloading={props.downloading}
                  onDownload={props.onDownload}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-surface-outline p-6 text-sm text-content-dimmed mt-3">
      No exports yet. Start one when you need to move this company to another Operately instance.
    </div>
  );
}

function ExportRunCard({
  run,
  latest,
  downloading,
  onDownload,
}: {
  run: CompanyExportPage.Run;
  latest: boolean;
  downloading: string | null;
  onDownload: (runId: string) => void | Promise<void>;
}) {
  const latestStatusTestId = latest ? "latest-export-run-status" : undefined;
  const latestProgressTestId = latest ? "latest-export-run-progress" : undefined;
  const latestPackageTestId = latest ? "latest-export-download-package" : undefined;

  return (
    <div className="rounded-lg border border-surface-outline p-4" data-test-id={latest ? "latest-export-run" : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip content={<RunStatusTooltip run={run} />} size="sm" testId={latestStatusTestId}>
              <RunStatus status={run.status} />
            </Tooltip>

            <div className="text-xs text-content-dimmed">
              <FormattedTime time={run.completedAt || run.insertedAt} format="short-date-with-weekday" />
            </div>
          </div>

          {run.errorMessage && <div className="mt-2 text-sm text-red-600">{run.errorMessage}</div>}
        </div>

        <div className="flex flex-wrap gap-2">
          <SecondaryButton
            size="xs"
            onClick={() => onDownload(run.id)}
            disabled={run.status !== "completed"}
            loading={downloading === run.id}
            testId={latestPackageTestId}
            icon={IconDownload}
          >
            Download
          </SecondaryButton>
        </div>
      </div>

      {(run.status === "pending" || run.status === "running" || (run.percentage ?? 0) > 0) && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-content-dimmed">
            <span data-test-id={latestProgressTestId}>{Math.round(run.percentage ?? 0)}%</span>
            <span>{humanizeStep(run.currentStep)}</span>
          </div>

          <ProgressBar progress={run.percentage ?? 0} status={progressStatus(run.status)} />
        </div>
      )}
    </div>
  );
}

function RunStatus({ status }: { status: string }) {
  return <span className={statusClassName(status)}>{status}</span>;
}

function RunStatusTooltip({ run }: { run: CompanyExportPage.Run }) {
  return (
    <div className="space-y-1 text-left">
      <div>
        Requested: <FormattedTime time={run.insertedAt} format="relative-time-or-date" />
      </div>

      {run.completedAt && (
        <div>
          Completed: <FormattedTime time={run.completedAt} format="relative-time-or-date" />
        </div>
      )}

      <div>Rows: {run.rowsCount ?? 0}</div>
      <div>Tables: {run.tablesCount ?? 0}</div>
      <div>Step: {humanizeStep(run.currentStep)}</div>
    </div>
  );
}

function progressStatus(status: string) {
  switch (status) {
    case "completed":
      return "achieved" as const;
    case "failed":
      return "off_track" as const;
    case "cancelled":
      return "paused" as const;
    case "running":
    case "pending":
    default:
      return "pending" as const;
  }
}

function statusClassName(status: string) {
  return classNames("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold capitalize", {
    "bg-green-100 text-green-700": status === "completed",
    "bg-red-100 text-red-700": status === "failed",
    "bg-blue-100 text-blue-700": status === "running",
    "bg-slate-200 text-slate-700": status === "cancelled",
    "bg-amber-100 text-amber-700": !["completed", "failed", "running", "cancelled"].includes(status),
  });
}

function humanizeStep(step?: string | null) {
  if (!step) return "Queued";

  return step
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
