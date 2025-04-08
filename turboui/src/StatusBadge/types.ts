/**
 * Status values for the StatusBadge component
 */
export type BadgeStatus = 
  // Progress states
  | 'on_track' 
  | 'caution'
  | 'issue'
  | 'paused'
  | 'pending'
  // Completion states
  | 'achieved'   // Goal fully accomplished (green)
  | 'partial'    // Goal partially accomplished (amber/yellow)
  | 'missed'     // Goal not accomplished (red)
  // Legacy/alternative states
  | 'completed'  // Legacy term for achieved
  | 'dropped'    // Goal abandoned
  | 'failed'     // Legacy term for missed
  | string;      // Allow custom status strings

/**
 * Props for the StatusBadge component
 */
export interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
  style?: React.CSSProperties;
}
