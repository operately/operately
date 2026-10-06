import React from "react";
import { useTranslation } from "react-i18next";

export interface ContentListSkeletonProps {
  count?: number;
  leadingShape?: "avatar" | "document";
  label?: string;
  testId?: string;
  variant?: "list" | "feed";
}

export function ContentListSkeleton({
  count = 3,
  leadingShape = "avatar",
  label,
  testId = "content-list-skeleton",
  variant = "list",
}: ContentListSkeletonProps) {
  const { t } = useTranslation();
  const accessibleLabel = label ?? t("Loading items");

  return (
    <div role="status" aria-label={accessibleLabel} data-test-id={testId}>
      <span className="sr-only">{accessibleLabel}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className={
              variant === "feed" ? "flex gap-3 pb-4" : "flex gap-4 px-3 py-4 border-t last:border-b border-stroke-base"
            }
          >
            <div
              className={
                leadingShape === "avatar"
                  ? `${variant === "feed" ? "h-8 w-8" : "h-10 w-10"} shrink-0 rounded-full bg-surface-highlight`
                  : "h-12 w-9 shrink-0 rounded bg-surface-highlight"
              }
            />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-4 w-2/3 rounded bg-surface-highlight" />
              <div className="h-3 w-1/3 rounded bg-surface-highlight" />
              <div className="h-3 w-full rounded bg-surface-highlight" />
              <div className="h-3 w-4/5 rounded bg-surface-highlight" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
