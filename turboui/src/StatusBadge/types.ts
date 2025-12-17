/**
 * Status values for the StatusBadge component
 */
import type { StatusSelector } from "../StatusSelector";

export type BadgeStatus = 
  // Progress states
  | 'on_track' 
  | 'caution'
  | 'off_track'
  | 'paused'
  | 'pending'
  // Completion states
  | 'achieved'
  | 'missed'
  | string;      // Allow custom status strings

export type StatusBadgeStatus = BadgeStatus | StatusSelector.StatusOption;

/**
 * Props for the StatusBadge component
 */
export interface StatusBadgeProps {
  status: StatusBadgeStatus;
  hideIcon?: boolean; // Option to hide the status icon
  className?: string;
  style?: React.CSSProperties;
  customLabel?: string; // Optional custom label to override default
}
