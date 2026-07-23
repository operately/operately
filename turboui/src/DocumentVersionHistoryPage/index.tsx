import React from "react";

import { GhostButton } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import { Page } from "../Page";
import RichContent from "../RichContent";

import type { DocumentVersionHistoryPageProps } from "./types";
import { sortVersionsNewestFirst, versionPreviewContent } from "./types";
import { VersionTimeline } from "./VersionTimeline";

export namespace DocumentVersionHistoryPage {
  export type Props = DocumentVersionHistoryPageProps;
}

export {
  resolveSelection,
  sortVersionsNewestFirst,
  sortVersionsOldestFirst,
  defaultSelectedVersionNumber,
  editorLabel,
  eventActionText,
  eventDescription,
  isMigrationBaseline,
  migrationBaselineExplanation,
  migrationBaselineTitle,
} from "./types";
export type { ComparisonStatus, VersionSnapshot, DocumentVersionHistoryPageProps, RestoreResult } from "./types";

export function DocumentVersionHistoryPage(props: DocumentVersionHistoryPage.Props) {
  const versions = sortVersionsNewestFirst(props.versions);
  // null follows the latest/current version when props.versions refresh
  const [selectedVersionNumber, setSelectedVersionNumber] = React.useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [conflict, setConflict] = React.useState(false);

  const selectedVersion =
    (selectedVersionNumber != null
      ? versions.find((version) => version.versionNumber === selectedVersionNumber)
      : null) ??
    versions.find((version) => version.isCurrent) ??
    versions[0] ??
    null;

  const currentVersionNumber =
    props.currentVersionNumber ?? versions.find((version) => version.isCurrent)?.versionNumber ?? null;

  const canRestoreSelected =
    Boolean(props.canRestore) &&
    Boolean(props.onRestore) &&
    selectedVersion != null &&
    !selectedVersion.isCurrent &&
    currentVersionNumber != null;

  React.useEffect(() => {
    if (selectedVersionNumber != null && !versions.some((version) => version.versionNumber === selectedVersionNumber)) {
      setSelectedVersionNumber(null);
    }
  }, [versions, selectedVersionNumber]);

  const handleConfirmRestore = async () => {
    if (!selectedVersion || currentVersionNumber == null || !props.onRestore) return;

    setRestoring(true);
    try {
      const result = await props.onRestore(selectedVersion.versionNumber, currentVersionNumber);
      setConfirmOpen(false);

      if (result === "conflict") {
        setConflict(true);
        return;
      }

      if (result === "ok") {
        setConflict(false);
        setSelectedVersionNumber(null);
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleReload = async () => {
    setConflict(false);
    setSelectedVersionNumber(null);
    await props.onReload?.();
  };

  return (
    <Page title={props.title} size="xlarge" navigation={props.navigation} testId="document-version-history-page">
      <div className="min-h-[75vh] px-4 py-8 sm:px-10">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-content-accent md:text-4xl">History of changes</h1>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
          <section
            className="min-w-0 rounded-lg border border-surface-outline bg-surface-base p-5 sm:p-6"
            aria-label="Selected version"
            data-test-id="selected-version-preview"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-content-accent md:text-2xl">
                {selectedVersion?.title || "Untitled"}
              </h2>
              {canRestoreSelected && (
                <GhostButton size="xxs" onClick={() => setConfirmOpen(true)} testId="restore-this-version">
                  Restore This Version
                </GhostButton>
              )}
            </div>
            <div className="mt-4 text-content-base">
              <RichContent
                content={versionPreviewContent(selectedVersion)}
                mentionedPersonLookup={props.mentionedPersonLookup}
              />
            </div>
          </section>

          <aside className="min-w-0">
            <VersionTimeline
              versions={versions}
              selectedVersionNumber={selectedVersion?.versionNumber ?? null}
              onSelectVersion={setSelectedVersionNumber}
              formattedTimePreferences={props.formattedTimePreferences}
              getComparisonPath={props.getComparisonPath}
            />
          </aside>
        </div>
      </div>

      {selectedVersion && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmRestore}
          title="Restore this version?"
          message="This replaces the current title and content with the selected version. Later versions will stay in the history."
          confirmText={restoring ? "Restoring…" : "Restore"}
          cancelText="Cancel"
          testId="restore-version-confirm"
        />
      )}

      <ConfirmDialog
        isOpen={conflict}
        onCancel={() => setConflict(false)}
        onConfirm={handleReload}
        title="Document changed since you opened it"
        message="A newer version was saved. Reload the latest version and try again."
        confirmText="Reload"
        cancelText="Cancel"
        testId="restore-conflict"
        size="medium"
      />
    </Page>
  );
}
