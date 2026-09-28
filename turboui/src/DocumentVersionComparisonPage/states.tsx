import React from "react";
import { useTranslation } from "react-i18next";

import { SecondaryButton } from "../Button";

export function NoChangesState() {
  const { t } = useTranslation();
  return (
    <div
      className="border-t border-surface-outline bg-surface-dimmed py-4 text-sm text-content-dimmed"
      data-test-id="no-content-changes"
    >
      {t("No content changes between these versions.")}
    </div>
  );
}

export function ComparisonLoadingState() {
  const { t } = useTranslation();
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2"
      data-test-id="comparison-loading"
      role="status"
      aria-label={t("Loading comparison")}
    >
      <span className="sr-only">{t("Loading comparison…")}</span>
      <LoadingPane position="before" />
      <LoadingPane position="after" />
    </div>
  );
}

function LoadingPane({ position }: { position: "before" | "after" }) {
  return (
    <div
      className={
        position === "before"
          ? "border-b border-stroke-base pb-5 sm:pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-8"
          : "pt-5 sm:pt-8 md:pt-0 md:pl-8"
      }
      aria-hidden
    >
      <div className="animate-pulse">
        <div className="h-3 w-20 rounded bg-surface-dimmed" />
        <div className="mt-3 h-3 w-32 rounded bg-surface-dimmed" />
        <div className="mt-7 h-7 w-3/4 rounded bg-surface-dimmed" />
        <div className="mt-8 space-y-3">
          <div className="h-3 w-full rounded bg-surface-dimmed" />
          <div className="h-3 w-11/12 rounded bg-surface-dimmed" />
          <div className="h-3 w-4/5 rounded bg-surface-dimmed" />
        </div>
      </div>
    </div>
  );
}

export function ComparisonErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div data-test-id="comparison-error" role="alert">
      <h2 className="font-medium text-content-error">{t("Unable to load this comparison")}</h2>
      <p className="mt-1 text-sm text-content-dimmed">
        {t("One of the selected versions could not be loaded. Try again or choose another version from the history.")}
      </p>
      <div className="mt-4">
        <SecondaryButton size="sm" onClick={onRetry} testId="retry-comparison">
          {t("Retry")}
        </SecondaryButton>
      </div>
    </div>
  );
}

export function VersionUnavailableState() {
  const { t } = useTranslation();
  return (
    <div data-test-id="version-unavailable" role="alert">
      <h2 className="font-medium text-content-error">{t("Version unavailable")}</h2>
      <p className="mt-1 text-sm text-content-dimmed">
        {t("That version could not be found. Choose another version from the history list.")}
      </p>
    </div>
  );
}
