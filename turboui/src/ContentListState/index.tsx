import { useTranslation } from "react-i18next";
import React from "react";
import { SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { ContentListSkeleton } from "../ContentListSkeleton";

interface Props {
  name: "check-ins" | "discussions" | "tasks" | "docs-and-files" | "related-work";
  className?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function ContentListState({ name, className, loading, error, onRetry, children }: Props) {
  const { t } = useTranslation();
  const messages = {
    "check-ins": { error: t("Unable to load check-ins."), loading: t("Loading check-ins") },
    discussions: { error: t("Unable to load discussions."), loading: t("Loading discussions") },
    tasks: { error: t("Unable to load tasks."), loading: t("Loading tasks") },
    "docs-and-files": { error: t("Unable to load docs and files."), loading: t("Loading docs and files") },
    "related-work": { error: t("Unable to load subgoals and projects."), loading: t("Loading subgoals and projects") },
  }[name];

  return (
    <div className={className} aria-busy={loading || undefined}>
      {error && (
        <div role="alert" className="mb-4" data-test-id={`${name}-error`}>
          <ErrorCallout message={messages.error} />
          {onRetry && (
            <SecondaryButton size="xs" className="mt-3" onClick={onRetry} testId={`retry-${name}`}>
              {t("Retry")}
            </SecondaryButton>
          )}
        </div>
      )}
      {loading ? (
        <ContentListSkeleton
          leadingShape={name === "docs-and-files" ? "document" : "avatar"}
          label={messages.loading}
          testId={`${name}-skeleton`}
        />
      ) : (
        children
      )}
    </div>
  );
}
