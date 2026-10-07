import i18n from "../i18n";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      setActionError(t("Search index maintenance could not be started. Try again."));
      setPendingAction(null);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10" data-test-id="search-index-admin-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-base">{t("Search index")}</h1>
          <p className="mt-1 max-w-3xl text-sm text-content-subtle">
            {t("Monitor indexing progress and repair search data when canonical records change.")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SecondaryButton size="sm" onClick={() => setPendingAction({ kind: "backfill" })}>
            {t("Backfill all sources")}
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={() => setPendingAction({ kind: "reconciliation" })}>
            {t("Reconcile all sources")}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6">
        <InfoCallout
          message={t("Backfills add missing entries. Reconciliation performs a complete repair.")}
          description={t(
            "Reconciliation also updates stale entries and removes entries whose source record no longer exists.",
          )}
        />
      </div>

      {actionError ? (
        <div className="mt-4">
          <ErrorCallout message={actionError} />
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-lg border border-stroke-base bg-surface-base">
        <div className="hidden grid-cols-[minmax(12rem,1.2fr)_minmax(12rem,1fr)_minmax(20rem,2fr)_auto] gap-4 border-b border-stroke-base bg-surface-dimmed px-5 py-3 text-xs font-bold uppercase text-content-subtle lg:grid">
          <div>{t("Source")}</div>
          <div>{t("Latest run")}</div>
          <div>{t("Progress")}</div>
          <div>{t("Actions")}</div>
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
        cancelText={t("Cancel")}
        testId="confirm-search-index-maintenance"
      />

      <span className="sr-only" aria-live="polite">
        {starting ? t("Starting search index maintenance…") : ""}
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
  const { t } = useTranslation();
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
                <span>{t("Started:")}</span>{" "}
                <FormattedTime
                  {...formattedTimePreferences}
                  time={run.startedAt || run.insertedAt}
                  format="relative-time-or-date"
                />
              </div>
              {run.completedAt ? (
                <div>
                  <span>{t("Completed:")}</span>{" "}
                  <FormattedTime {...formattedTimePreferences} time={run.completedAt} format="relative-time-or-date" />
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <span className="text-sm text-content-subtle">{t("Not started")}</span>
        )}
      </div>

      <div>
        {run ? (
          <>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs text-content-dimmed sm:grid-cols-4">
              <Counter label={t("Processed")} value={run.processedCount} />
              <Counter label={t("Inserted")} value={run.insertedCount} />
              <Counter label={t("Updated")} value={run.updatedCount} />
              <Counter label={t("Unchanged")} value={run.unchangedCount} />
              <Counter label={t("Skipped")} value={run.skippedCount} />
              <Counter label={t("Failed")} value={run.failedCount} />
              <Counter label={t("Superseded")} value={run.supersededCount} />
              <Counter label={t("Orphans removed")} value={run.deletedOrphanCount} />
            </div>
            {run.lastError ? <p className="mt-2 break-words text-xs text-content-error">{run.lastError}</p> : null}
          </>
        ) : (
          <span className="text-sm text-content-subtle">{t("No progress to report.")}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <SecondaryButton size="xs" disabled={active} onClick={() => onStart("backfill")}>
          {t("Run backfill")}
        </SecondaryButton>
        <SecondaryButton size="xs" disabled={active} onClick={() => onStart("reconciliation")}>
          {t("Run reconciliation")}
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
    resource_hub_folder: i18n.t("Folders"),
    resource_hub_document: i18n.t("Documents"),
    resource_hub_file: i18n.t("Files"),
    resource_hub_link: i18n.t("Links"),
    project: i18n.t("Projects"),
    goal: i18n.t("Goals"),
    milestone: i18n.t("Milestones"),
    task: i18n.t("Tasks"),
    person: i18n.t("People"),
    discussion: i18n.t("Discussions"),
    project_check_in: i18n.t("Project check-ins"),
    goal_check_in: i18n.t("Goal check-ins"),
    project_retrospective: i18n.t("Project retrospectives"),
  };

  return labels[sourceType] || sourceType;
}

function statusLabel(status: RunStatus): string {
  const labels: Record<RunStatus, string> = {
    pending: i18n.t("Pending"),
    running: i18n.t("Running"),
    completed: i18n.t("Completed"),
    completed_with_errors: i18n.t("Completed with errors"),
    failed: i18n.t("Failed"),
  };

  return labels[status];
}

function kindLabel(kind: MaintenanceKind): string {
  return kind === "backfill" ? i18n.t("Backfill") : i18n.t("Reconciliation");
}

function phaseLabel(phase: SearchIndexRun["phase"]): string {
  return phase === "source_scan" ? i18n.t("Source scan") : i18n.t("Index scan");
}

function confirmationTitle(action: PendingAction | null): string {
  if (!action) return i18n.t("Start search index maintenance?");
  if (!action.sourceType) {
    return action.kind === "backfill" ? i18n.t("Backfill all sources?") : i18n.t("Reconcile all sources?");
  }
  const target = sourceLabel(action.sourceType);
  return action.kind === "backfill"
    ? i18n.t("Backfill {{target}}?", { target })
    : i18n.t("Reconcile {{target}}?", { target });
}

function confirmationMessage(action: PendingAction | null): string {
  if (!action) return i18n.t("This starts a background search index job.");

  if (action.kind === "backfill") {
    return i18n.t("This starts a background job that adds missing entries and refreshes newer canonical records.");
  }

  return i18n.t("This starts a complete background repair that also updates stale entries and removes orphans.");
}

function confirmationButton(action: PendingAction | null): string {
  return action?.kind === "reconciliation" ? i18n.t("Run reconciliation") : i18n.t("Run backfill");
}
