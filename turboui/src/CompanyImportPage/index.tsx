import React from "react";

import { FormattedTime } from "../FormattedTime";
import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";
import { ProgressBar } from "../ProgressBar";
import { Tooltip } from "../Tooltip";
import classNames from "../utils/classnames";

export namespace CompanyImportPage {
  export interface UploadedFileState {
    blobId: string | null;
    fileName: string | null;
    progress: number;
    uploading: boolean;
  }

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
    companyPath?: string | null;
  }

  export interface Props {
    runs: Run[];
    jsonFile: UploadedFileState;
    zipFile: UploadedFileState;
    starting: boolean;
    canUpload: boolean;
    canStartImport: boolean;
    backPath: string;
    uploadsUnavailableMessage?: string | null;
    onStartImport: () => void | Promise<void>;
    onSelectJsonFile: (file: File) => void | Promise<void>;
    onSelectZipFile: (file: File) => void | Promise<void>;
  }
}

export function CompanyImportPage(props: CompanyImportPage.Props) {
  const navigation = React.useMemo(() => [{ to: props.backPath, label: "Back to the Lobby" }], [props.backPath]);

  return (
    <Page title="Import Company" size="small" testId="company-import-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="uppercase text-sm tracking-wide">Company Import</div>
            <h1 className="text-content-accent text-3xl font-extrabold">Import company</h1>
            <p className="mt-2 text-content-dimmed">
              Upload the exported JSON package and ZIP archive, then start importing the company into this Operately
              instance.
            </p>
          </div>

          <PrimaryButton
            size="sm"
            onClick={props.onStartImport}
            loading={props.starting}
            disabled={!props.canStartImport}
            testId="start-import-button"
          >
            Start import
          </PrimaryButton>
        </header>

        <section className="mt-10">
          <h2 className="font-bold">Artifacts</h2>

          {props.canUpload ? (
            <div className="grid gap-4 md:grid-cols-2 mt-3">
              <ArtifactUploadCard
                title="JSON package"
                testIdPrefix="import-json"
                state={props.jsonFile}
                accept=".json,application/json"
                buttonLabel="Choose JSON"
                onSelectFile={props.onSelectJsonFile}
              />

              <ArtifactUploadCard
                title="ZIP archive"
                testIdPrefix="import-zip"
                state={props.zipFile}
                accept=".zip,application/zip"
                buttonLabel="Choose ZIP"
                onSelectFile={props.onSelectZipFile}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-surface-outline p-6 text-sm text-content-dimmed mt-3">
              {props.uploadsUnavailableMessage || "Uploads are unavailable for this account right now."}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-bold">Imports</h2>

          {props.runs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3 mt-3">
              {props.runs.map((run, index) => (
                <ImportRunCard key={run.id} run={run} latest={index === 0} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}

interface ArtifactUploadCardProps {
  title: string;
  testIdPrefix: string;
  state: CompanyImportPage.UploadedFileState;
  accept: string;
  buttonLabel: string;
  onSelectFile: (file: File) => void | Promise<void>;
}

function ArtifactUploadCard({
  title,
  testIdPrefix,
  state,
  accept,
  buttonLabel,
  onSelectFile,
}: ArtifactUploadCardProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.currentTarget.value = "";
      if (!file) return;
      void onSelectFile(file);
    },
    [onSelectFile],
  );

  return (
    <div className="rounded-lg border border-surface-outline p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
        </div>

        <Tooltip content={<UploadStatusTooltip state={state} />} size="sm">
          <span className={uploadStatusClassName(state)} data-test-id={`${testIdPrefix}-status`}>
            {shortUploadStatus(state)}
          </span>
        </Tooltip>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        data-test-id={`${testIdPrefix}-input`}
        className="hidden"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SecondaryButton size="sm" onClick={() => inputRef.current?.click()}>
          {buttonLabel}
        </SecondaryButton>

        <Tooltip content={state.fileName || "No file selected"} size="sm">
          <div className="text-sm text-content-dimmed truncate" data-test-id={`${testIdPrefix}-filename`}>
            {state.fileName || "No file selected"}
          </div>
        </Tooltip>
      </div>

      {(state.uploading || state.progress > 0) && (
        <div className="mt-2">
          <ProgressBar progress={state.progress} status={uploadProgressStatus(state)} />
        </div>
      )}
    </div>
  );
}

function ImportRunCard({ run, latest }: { run: CompanyImportPage.Run; latest: boolean }) {
  const latestStatusTestId = latest ? "latest-import-run-status" : undefined;
  const latestProgressTestId = latest ? "latest-import-run-progress" : undefined;

  return (
    <div
      className="rounded-lg border border-surface-outline p-4"
      data-test-id={latest ? "latest-import-run" : undefined}
    >
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

        {run.companyPath && run.status === "completed" && (
          // Use a plain anchor on purpose: opening the imported company needs a full document reload.
          <a
            href={run.companyPath}
            data-test-id={latest ? "latest-import-open-company" : undefined}
            className="cursor-pointer text-sm text-link-base transition-colors hover:text-link-hover"
          >
            Open company
          </a>
        )}
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

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-surface-outline p-6 text-sm text-content-dimmed mt-3">
      No imports yet. Upload artifacts above to create the first one.
    </div>
  );
}

function RunStatus({ status }: { status: string }) {
  return <span className={statusClassName(status)}>{status}</span>;
}

function RunStatusTooltip({ run }: { run: CompanyImportPage.Run }) {
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

function UploadStatusTooltip({ state }: { state: CompanyImportPage.UploadedFileState }) {
  return (
    <div className="space-y-1 text-left">
      <div>File: {state.fileName || "No file selected"}</div>
      <div>Status: {renderUploadStatus(state)}</div>
      <div>Progress: {Math.round(state.progress)}%</div>
    </div>
  );
}

function renderUploadStatus(state: CompanyImportPage.UploadedFileState) {
  if (state.uploading) return `Uploading ${state.fileName ?? "file"}...`;
  if (state.blobId) return "Uploaded";
  if (state.fileName) return "Upload failed";
  return "Waiting for file selection";
}

function shortUploadStatus(state: CompanyImportPage.UploadedFileState) {
  if (state.uploading) return "Uploading";
  if (state.blobId) return "Uploaded";
  if (state.fileName) return "Failed";
  return "Waiting";
}

function uploadStatusClassName(state: CompanyImportPage.UploadedFileState) {
  return classNames("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", {
    "bg-blue-100 text-blue-700": state.uploading,
    "bg-green-100 text-green-700": state.blobId,
    "bg-red-100 text-red-700": state.fileName && !state.uploading && !state.blobId,
    "bg-slate-100 text-slate-700": !state.uploading && !state.blobId && !state.fileName,
  });
}

function uploadProgressStatus(state: CompanyImportPage.UploadedFileState) {
  if (state.blobId) return "achieved" as const;
  if (state.fileName && !state.uploading) return "off_track" as const;
  return "pending" as const;
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
