import React from "react";

import { SecondaryButton } from "../Button";

export function OneVersionEmptyState() {
  return (
    <div className="rounded-lg border border-surface-outline bg-surface-base p-6" data-test-id="one-version-empty">
      <h2 className="text-lg font-semibold text-content-accent">No Earlier Versions</h2>
      <p className="mt-2 text-sm text-content-dimmed">
        Changes to the title or content will appear here after the document is saved.
      </p>
    </div>
  );
}

export function NoChangesState() {
  return (
    <div
      className="rounded-lg border border-surface-outline bg-surface-base px-4 py-3 text-sm text-content-dimmed"
      data-test-id="no-content-changes"
    >
      No content changes between these versions.
    </div>
  );
}

export function ComparisonLoadingState() {
  return (
    <div
      className="rounded-lg border border-surface-outline bg-surface-base px-4 py-8 text-center text-sm text-content-dimmed"
      data-test-id="comparison-loading"
      role="status"
    >
      Loading comparison…
    </div>
  );
}

export function ComparisonErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-lg border border-surface-outline bg-surface-base p-6"
      data-test-id="comparison-error"
      role="alert"
    >
      <h2 className="font-medium text-content-error">Unable to load this comparison</h2>
      <p className="mt-1 text-sm text-content-dimmed">
        One of the selected versions could not be loaded. Try again, or pick a different pair.
      </p>
      <div className="mt-4">
        <SecondaryButton size="sm" onClick={onRetry} testId="retry-comparison">
          Retry
        </SecondaryButton>
      </div>
    </div>
  );
}

export function VersionUnavailableState() {
  return (
    <div
      className="rounded-lg border border-surface-outline bg-surface-base p-6"
      data-test-id="version-unavailable"
      role="alert"
    >
      <h2 className="font-medium text-content-error">Version unavailable</h2>
      <p className="mt-1 text-sm text-content-dimmed">
        That version could not be found. Choose another version from the history list.
      </p>
    </div>
  );
}

export function FirstVersionState() {
  return (
    <div
      className="rounded-lg border border-surface-outline bg-surface-dimmed px-4 py-3 text-sm text-content-dimmed"
      data-test-id="first-version-notice"
    >
      This is the first saved version of the document. There is no earlier version to compare.
    </div>
  );
}
