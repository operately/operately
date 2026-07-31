import * as React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import { ErrorCallout, InfoCallout } from "../Callouts";
import { FormattedTime, FormattedTimePreferences } from "../FormattedTime";

export type MaintenanceKind = "backfill" | "reconciliation";
export type RunStatus = "pending" | "running" | "completed" | "completed_with_errors" | "failed";

export interface SearchIndexRun {
  id: string;
  kind: MaintenanceKind;
  status: RunStatus;
  phase: "source_scan" | "index_scan";
  processedCount: number;
  insertedCount: number;
  updatedCount: number;
  unchangedCount: number;
  supersededCount: number;
  skippedCount: number;
  failedCount: number;
  deletedOrphanCount: number;
  lastError?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  insertedAt: string;
}

export interface SearchIndexSourceStatus {
  sourceType: string;
  latestRun?: SearchIndexRun | null;
}

export interface StartMaintenanceResult {
  startedSourceTypes: string[];
  alreadyRunningSourceTypes: string[];
}

export interface SearchIndexAdminPageProps {
  sources: SearchIndexSourceStatus[];
  formattedTimePreferences: FormattedTimePreferences;
  onStartMaintenance: (kind: MaintenanceKind, sourceType?: string) => Promise<StartMaintenanceResult>;
}

interface PendingAction {
  kind: MaintenanceKind;
  sourceType?: string;
}

export function SearchIndexAdminPage(props: SearchIndexAdminPageProps) {
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const confirmAction = async () => {
    if (!pendingAction || starting) return;

    setStarting(true);
    setActionError(null);

    try {
      await props.onStartMaintenance(pendingAction.kind, pendingAction.sourceType);
      setPendingAction(null);
    } catch (_error) {
      setActionError("Search index maintenance could not be started. Try again.");
      setPendingAction(null);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10" data-test-id="search-index-admin-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-base">Search index</h1>
          <p className="mt-1 max-w-3xl text-sm text-content-subtle">
            Monitor indexing progress and repair search data when canonical records change.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SecondaryButton size="sm" onClick={() => setPendingAction({ kind: "backfill" })}>
            Backfill all sources
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={() => setPendingAction({ kind: "reconciliation" })}>
            Reconcile all sources
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6">
        <InfoCallout
          message="Backfills add missing entries. Reconciliation performs a complete repair."
          description="Reconciliation also updates stale entries and removes entries whose source record no longer exists."
        />
      </div>

      {actionError ? (
        <div className="mt-4">
          <ErrorCallout message={actionError} />
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-lg border border-stroke-base bg-surface-base">
        <div className="hidden grid-cols-[minmax(12rem,1.2fr)_minmax(12rem,1fr)_minmax(20rem,2fr)_auto] gap-4 border-b border-stroke-base bg-surface-dimmed px-5 py-3 text-xs font-bold uppercase text-content-subtle lg:grid">
          <div>Source</div>
          <div>Latest run</div>
          <div>Progress</div>
          <div>Actions</div>
        </div>

        {props.sources.map((source) => (
          <SourceRow
            key={source.sourceType}
            source={source}
            formattedTimePreferences={props.formattedTimePreferences}
            onStart={(kind) => setPendingAction({ kind, sourceType: source.sourceType })}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmAction()}
        title={confirmationTitle(pendingAction)}
        message={confirmationMessage(pendingAction)}
        confirmText={confirmationButton(pendingAction)}
        cancelText="Cancel"
        testId="confirm-search-index-maintenance"
      />

      <span className="sr-only" aria-live="polite">
        {starting ? "Starting search index maintenance…" : ""}
      </span>
    </div>
  );
}

function SourceRow({
  source,
  formattedTimePreferences,
  onStart,
}: {
  source: SearchIndexSourceStatus;
  formattedTimePreferences: FormattedTimePreferences;
  onStart: (kind: MaintenanceKind) => void;
}) {
  const run = source.latestRun;
  const active = run?.status === "pending" || run?.status === "running";

  return (
    <div className="grid gap-4 border-b border-stroke-base px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(12rem,1.2fr)_minmax(12rem,1fr)_minmax(20rem,2fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="font-medium text-content-base">{sourceLabel(source.sourceType)}</div>
        <div className="truncate text-xs text-content-subtle">{source.sourceType}</div>
      </div>

      <div>
        {run ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={run.status} />
              <span className="text-sm text-content-dimmed">
                {kindLabel(run.kind)} · {phaseLabel(run.phase)}
              </span>
            </div>
            <div className="mt-1 space-y-0.5 text-xs text-content-subtle">
              <div>
                <span>Started:</span>{" "}
                <FormattedTime
                  {...formattedTimePreferences}
                  time={run.startedAt || run.insertedAt}
                  format="relative-time-or-date"
                />
              </div>
              {run.completedAt ? (
                <div>
                  <span>Completed:</span>{" "}
                  <FormattedTime {...formattedTimePreferences} time={run.completedAt} format="relative-time-or-date" />
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <span className="text-sm text-content-subtle">Not started</span>
        )}
      </div>

      <div>
        {run ? (
          <>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs text-content-dimmed sm:grid-cols-4">
              <Counter label="Processed" value={run.processedCount} />
              <Counter label="Inserted" value={run.insertedCount} />
              <Counter label="Updated" value={run.updatedCount} />
              <Counter label="Unchanged" value={run.unchangedCount} />
              <Counter label="Skipped" value={run.skippedCount} />
              <Counter label="Failed" value={run.failedCount} />
              <Counter label="Superseded" value={run.supersededCount} />
              <Counter label="Orphans removed" value={run.deletedOrphanCount} />
            </div>
            {run.lastError ? <p className="mt-2 break-words text-xs text-content-error">{run.lastError}</p> : null}
          </>
        ) : (
          <span className="text-sm text-content-subtle">No progress to report.</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <SecondaryButton size="xs" disabled={active} onClick={() => onStart("backfill")}>
          Run backfill
        </SecondaryButton>
        <SecondaryButton size="xs" disabled={active} onClick={() => onStart("reconciliation")}>
          Run reconciliation
        </SecondaryButton>
      </div>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="text-content-subtle">{label}:</span> {value}
    </span>
  );
}

function StatusBadge({ status }: { status: RunStatus }) {
  const colors: Record<RunStatus, string> = {
    pending: "bg-surface-dimmed text-content-dimmed",
    running: "bg-callout-info-bg text-callout-info-content",
    completed: "bg-callout-success-bg text-callout-success-content",
    completed_with_errors: "bg-callout-warning-bg text-callout-warning-content",
    failed: "bg-callout-error-bg text-callout-error-content",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>{statusLabel(status)}</span>
  );
}

function sourceLabel(sourceType: string): string {
  const labels: Record<string, string> = {
    resource_hub_folder: "Folders",
    resource_hub_document: "Documents",
    resource_hub_file: "Files",
    resource_hub_link: "Links",
    project: "Projects",
    goal: "Goals",
    milestone: "Milestones",
    task: "Tasks",
    person: "People",
    discussion: "Discussions",
    project_check_in: "Project check-ins",
    goal_check_in: "Goal check-ins",
    project_retrospective: "Project retrospectives",
  };

  return labels[sourceType] || sourceType;
}

function statusLabel(status: RunStatus): string {
  const labels: Record<RunStatus, string> = {
    pending: "Pending",
    running: "Running",
    completed: "Completed",
    completed_with_errors: "Completed with errors",
    failed: "Failed",
  };

  return labels[status];
}

function kindLabel(kind: MaintenanceKind): string {
  return kind === "backfill" ? "Backfill" : "Reconciliation";
}

function phaseLabel(phase: SearchIndexRun["phase"]): string {
  return phase === "source_scan" ? "Source scan" : "Index scan";
}

function confirmationTitle(action: PendingAction | null): string {
  if (!action) return "Start search index maintenance?";
  const target = action.sourceType ? sourceLabel(action.sourceType) : "all sources";
  return `${action.kind === "backfill" ? "Backfill" : "Reconcile"} ${target}?`;
}

function confirmationMessage(action: PendingAction | null): string {
  if (!action) return "This starts a background search index job.";

  if (action.kind === "backfill") {
    return "This starts a background job that adds missing entries and refreshes newer canonical records.";
  }

  return "This starts a complete background repair that also updates stale entries and removes orphans.";
}

function confirmationButton(action: PendingAction | null): string {
  return action?.kind === "reconciliation" ? "Run reconciliation" : "Run backfill";
}
