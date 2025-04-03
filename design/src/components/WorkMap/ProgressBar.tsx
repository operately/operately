import React from "react";
import type { ProgressBarProps } from "../../types/workmap";
import type { GoalStatus } from "../../types/workmap";

export function ProgressBar({ progress, status, size = "md", showLabel = false }: ProgressBarProps & { status?: GoalStatus }): React.ReactElement {
  // Convert progress from 0-100 to width percentage
  const progressWidth = `${progress}%`;

  // Determine color based on status
  let progressColor: string;
  switch (status) {
    case "on_track":
    case "completed":
    case "achieved": // Include achieved status (green) from the goal completion model
      progressColor = "bg-green-500 dark:bg-green-400";
      break;
    case "paused":
    case "dropped":
      progressColor = "bg-gray-400 dark:bg-gray-500";
      break;
    case "caution":
    case "partial": // Include partial status (amber) from the goal completion model
      progressColor = "bg-amber-500 dark:bg-amber-400";
      break;
    case "issue":
    case "missed": // Include missed status (red) from the goal completion model
      progressColor = "bg-red-500 dark:bg-red-400";
      break;
    case "pending":
      progressColor = "bg-blue-500 dark:bg-blue-400";
      break;
    default:
      progressColor = "bg-gray-400 dark:bg-gray-500";
  }

  // Determine height based on size
  let heightClass: string;
  switch (size) {
    case "sm":
      heightClass = "h-1";
      break;
    case "lg":
      heightClass = "h-3";
      break;
    case "md":
    default:
      heightClass = "h-2";
  }

  return (
    <div className="w-full flex items-center gap-2">
      <div className={`w-full ${heightClass} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full ${progressColor} relative overflow-hidden`}
          style={{ width: progressWidth }}
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
