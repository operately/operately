/**
 * Types specific to the WorkMap functionality
 */
import type { BaseComponentProps, WithChildren, WithId } from "./common";
import type { ProgressBarStatus as GoalStatus } from "turboui/ProgressBar";

/**
 * Owner information structure
 */
export interface Owner {
  name: string;
  initials?: string; // Making initials optional to accommodate existing data
  avatar?: string;
}

/**
 * Deadline information
 */
export interface Deadline {
  display: string;
  isPast?: boolean;
  date?: string | Date;
}

/**
 * Completion date information for completed work items
 */
export interface CompletedOn {
  display: string;
  date?: string | Date;
}

/**
 * WorkMap Item - represents a goal or project in the work map
 */
export interface WorkMapItem extends WithId {
  name: string;
  type: "goal" | "project";
  status: GoalStatus;
  progress: number; // 0-100
  space: string;
  owner: Owner;
  children: WorkMapItem[];
  deadline?: Deadline; // Making optional to accommodate existing data
  nextStep?: string;
  description?: string;
  completedOn?: CompletedOn; // Date when the item was completed (for completed items)
  isNew?: boolean; // Flag to indicate newly added items for highlighting
}

/**
 * WorkMap entry/row props (basic version)
 */
export interface WorkMapEntryProps extends WithId {
  title: string;
  description?: string;
  status: GoalStatus;
  dueDate?: string | Date;
  owner?: string;
  progress?: number; // 0-100
}

/**
 * Props for WorkMapTable component
 */
export interface WorkMapTableProps extends BaseComponentProps, WithChildren {
  entries?: WorkMapEntryProps[];
  loading?: boolean;
  onEntrySelect?: (entry: WorkMapEntryProps) => void;
}

/**
 * Props for TableRow component
 */
export interface TableRowProps extends BaseComponentProps {
  item: WorkMapItem;
  level: number;
  isLast: boolean;
  filter?: string;
  isSelected?: boolean;
  onRowClick?: (item: WorkMapItem) => void;
  selectedItemId?: string;
}

/**
 * Props for ProgressBar component
 */
export interface ProgressBarProps extends BaseComponentProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}
