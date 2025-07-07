/**
 * Goal status values
 *
 * Progress states:
 * - on_track: Goal is currently in progress and on track
 * - caution/issue: Goal is at risk or needs attention
 * - paused: Goal is temporarily paused
 * - pending: Goal is waiting to start or for approval
 *
 * Completion states (per goal completion model):
 * - achieved: Goal was fully accomplished (green)
 * - partial: Goal was partially accomplished (amber/yellow)
 * - missed: Goal was not accomplished (red)
 *
 * Legacy/alternative states:
 * - completed: Legacy term for achieved
 * - dropped: Goal was intentionally abandoned
 * - failed: Legacy term for missed (red)
 */
export type ProgressBarStatus =
  // Progress states
  | "on_track"
  | "caution"
  | "off_track"
  | "paused"
  | "pending"
  // Completion states
  | "achieved"
  | "partial"
  | "missed"
  // Legacy/alternative states
  | "issue"
  | "completed"
  | "dropped"
  | "failed";

export type ProgressBarSize = "sm" | "md" | "lg";

export interface ProgressBarProps {
  progress: number;
  status?: ProgressBarStatus;
  size?: ProgressBarSize;
  showLabel?: boolean;
}
