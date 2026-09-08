import React from "react";
import { SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { ContentListSkeleton } from "../ContentListSkeleton";

interface Props {
  name: "check-ins" | "discussions" | "tasks" | "docs-and-files";
  className?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function ContentListState({ name, className, loading, error, onRetry, children }: Props) {
  const label = name === "docs-and-files" ? "docs and files" : name;
  return (
    <div className={className} aria-busy={loading || undefined}>
      {error && (
        <div role="alert" className="mb-4" data-test-id={`${name}-error`}>
          <ErrorCallout message={`Unable to load ${label}.`} />
          {onRetry && (
            <SecondaryButton size="xs" className="mt-3" onClick={onRetry} testId={`retry-${name}`}>
              Retry
            </SecondaryButton>
          )}
        </div>
      )}
      {loading ? (
        <ContentListSkeleton
          leadingShape={name === "docs-and-files" ? "document" : "avatar"}
          label={`Loading ${label}`}
          testId={`${name}-skeleton`}
        />
      ) : (
        children
      )}
    </div>
  );
}
