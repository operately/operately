import React from "react";
import { match } from "ts-pattern";
import type { ProgressBarProps } from "./types";

export type { ProgressBarStatus, ProgressBarSize } from "./types";

export function ProgressBar({ progress, status, size = "md", showLabel = false }: ProgressBarProps) {
  // Convert progress from 0-100 to width percentage
  const progressWidth = `${progress}%`;

  // Determine color based on status
  const progressColor = match(status)
    .with("on_track", "achieved", () => "bg-emerald-500 dark:bg-emerald-400")
    .with("paused", () => "bg-gray-400 dark:bg-gray-500")
    .with("caution", () => "bg-amber-500 dark:bg-amber-400")
    .with("off_track", "missed", () => "bg-red-500 dark:bg-red-400")
    .with("pending", () => "bg-blue-500 dark:bg-blue-400")
    .otherwise(() => "bg-gray-400 dark:bg-gray-500");

  // Determine height based on size
  const heightClass = match(size)
    .with("sm", () => "h-1")
    .with("lg", () => "h-3")
    .with("md", () => "h-2")
    .exhaustive();

  return (
    <div role="progress-bar" className="w-full flex items-center gap-2">
      <div className={`w-full ${heightClass} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full ${progressColor} relative overflow-hidden`}
          style={{ width: progressWidth }}
          data-testid="progress-percentage-bar"
        >
          {/* Add subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-50 dark:via-white/30"></div>
        </div>
      </div>

      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium min-w-[36px] text-right">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}
