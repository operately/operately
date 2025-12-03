import { DateField } from "../DateField";
import { PersonField } from "../PersonField";
import { StatusSelector } from "../StatusSelector";

/**
 * TaskBoard component types
 *
 * This file contains all the shared types and interfaces for the TaskBoard component.
 * Moving these to a dedicated file helps prevent circular dependencies and improves code organization.
 */

/**
 * Task status types
 */
export type Status = StatusSelector.StatusOption;

/**
 * Person interface for task assignees
 */
export interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Milestone interface for task grouping
 */
export interface Milestone {
  id: string;
  name: string;
  dueDate?: DateField.ContextualDate | null;
  hasDescription?: boolean;
  hasComments?: boolean;
  commentCount?: number;
  status: "pending" | "done";
  link?: string;
  tasksOrderingState?: string[];
  completedAt?: Date | null;
}

export interface NewMilestonePayload extends Omit<Milestone, "id"> {}
export interface UpdateMilestonePayload {
  name: string;
  dueDate: DateField.ContextualDate | null;
}

export interface NewTaskPayload {
  title: string;
  milestone: Milestone | null;
  dueDate: DateField.ContextualDate | null;
  assignee: string | null;
  status?: Status;
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  title: string;
  status: Status | null;
  description: string | null;
  link: string;
  assignees?: Person[];
  milestone: Milestone | null;
  points?: number;
  dueDate: DateField.ContextualDate | null;
  hasDescription?: boolean;
  hasComments?: boolean;
  commentCount?: number;
  comments?: any[];
  _isHelperTask?: boolean;
}

/**
 * Task with index for drag-and-drop positioning
 */
export interface TaskWithIndex extends Task {
  index: number;
}

/**
 * Milestone stats for tracking completion
 */
export interface MilestoneStats {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  canceled: number;
}

/**
 * Milestone with stats for display
 */
export interface MilestoneWithStats {
  milestone: Milestone;
  stats: MilestoneStats;
}

/**
 * Callback interfaces for TaskBoard operations
 */
export interface TaskBoardCallbacks {
  /**
   * Callback for when a task status changes
   */
  onStatusChange?: (taskId: string, newStatus: Status) => void;

  /**
   * Callback for when a task is created
   */
  onTaskCreate?: (task: NewTaskPayload) => void;

  /**
   * Callback for when a milestone is created
   */
  onMilestoneCreate?: (milestone: NewMilestonePayload) => void;
}

/**
 * Props for the TaskBoard component
 */
/**
 * Filter types for TaskBoard
 */
export type FilterType =
  | "status"
  | "assignee"
  | "creator"
  | "milestone"
  | "content"
  | "due_date"
  | "created_date"
  | "updated_date"
  | "started_date"
  | "completed_date";

export type FilterOperator = "is" | "is_not" | "contains" | "does_not_contain" | "before" | "after" | "between";

export interface FilterCondition {
  id: string;
  type: FilterType;
  operator: FilterOperator;
  value: any;
  label: string;
}

export interface TaskBoardProps {
  tasks: Task[];
  milestones?: Milestone[];
  searchableMilestones: Milestone[]; // Filtered milestones for task creation modal
  onTaskCreate: (task: NewTaskPayload) => void;
  onMilestoneCreate?: (milestone: NewMilestonePayload) => void;
  onTaskAssigneeChange: (taskId: string, assignee: Person | null) => void;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskStatusChange: (taskId: string, status: Status | null) => void;
  onTaskMilestoneChange?: (taskId: string, milestoneId: string | null, index: number) => void;
  onMilestoneUpdate?: (milestoneId: string, updates: Partial<Milestone>) => void;
  onMilestoneSearch: (query: string) => Promise<void>;
  assigneePersonSearch?: PersonField.SearchData;

  // Filter functionality
  filters?: FilterCondition[];
  onFiltersChange?: (filters: FilterCondition[]) => void;

  // Status customization
  statuses: StatusSelector.StatusOption[];
  onSaveCustomStatuses: (statuses: StatusSelector.StatusOption[]) => void;
  canManageStatuses: boolean;
}
