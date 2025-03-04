import React from "react";

import classNames from "classnames";
import { Circle } from "@/components/Circle";

export type Status = "pending" | "on_track" | "concern" | "issue";

export const STATUS_COLORS = {
  pending: "bg-stone-500",
  on_track: "bg-accent-1",
  concern: "bg-yellow-500",
  issue: "bg-red-500",
};

export const STATUS_LABELS = {
  pending: "Pending",
  on_track: "On Track",
  concern: "Concern",
  issue: "Issue",
};

export function StatusValue({ value, className }: { value: Status | null; className?: string }) {
  className = classNames(
    "border border-stroke-base shadow-sm bg-surface-dimmed text-sm rounded-lg px-2 py-1.5 relative overflow-hidden group",
    className,
  );

  return (
    <div className="w-48">
      <div className={className}>
        {value === null ? (
          <div className="flex items-center gap-2">
            <Circle size={18} border="border-surface-outline" noFill borderSize={2} borderDashed />
            <div className="font-medium">Pick a status&hellip;</div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Circle size={18} color={STATUS_COLORS[value]} />
            <div className="font-medium">{STATUS_LABELS[value]}</div>
          </div>
        )}
      </div>
    </div>
  );
}
