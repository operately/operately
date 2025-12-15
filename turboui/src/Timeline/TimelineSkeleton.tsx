import React from "react";

export function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-2 animate-pulse">
      <TimelineSkeletonItem />
      <TimelineSkeletonItem />
      <TimelineSkeletonItem />
    </div>
  );
}

function TimelineSkeletonItem() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-surface-highlight" />

      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-48 rounded bg-surface-highlight" />
        <div className="h-3 w-3/4 rounded bg-surface-highlight" />
        <div className="h-3 w-2/3 rounded bg-surface-highlight" />
      </div>
    </div>
  );
}
