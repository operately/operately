/**
 * Status values for the StatusBadge component
 */
export type BadgeStatus = 
  // Progress states
  | 'on_track' 
  | 'caution'
  | 'off_track'
  | 'paused'
  | 'pending'
  // Completion states
  | 'achieved'   // Goal fully accomplished (green)
  | 'missed'     // Goal not accomplished (red)
  // Legacy/alternative states
  | 'completed'  // Legacy term for achieved
  | string;      // Allow custom status strings

/**
 * Props for the StatusBadge component
 */
export interface StatusBadgeProps {
  status: BadgeStatus;
  hideIcon?: boolean; // Option to hide the status icon
  className?: string;
  style?: React.CSSProperties;
  customLabel?: string; // Optional custom label to override default
}
