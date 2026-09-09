import React from "react";

export interface ContentListSkeletonProps {
  count?: number;
  leadingShape?: "avatar" | "document";
  label?: string;
  testId?: string;
}

export function ContentListSkeleton({
  count = 3,
  leadingShape = "avatar",
  label = "Loading items",
  testId = "content-list-skeleton",
}: ContentListSkeletonProps) {
  return (
    <div role="status" aria-label={label} data-test-id={testId}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex gap-4 px-3 py-4 border-t last:border-b border-stroke-base">
            <div
              className={
                leadingShape === "avatar"
                  ? "h-10 w-10 shrink-0 rounded-full bg-surface-highlight"
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
