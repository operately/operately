import { DateField } from "../DateField";
import { PersonField } from "../PersonField";
import { StatusSelector } from "../StatusSelector";
import type { ProjectField } from "../ProjectField";
import type { RichTextJSON } from "../RichContent";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { SpaceField } from "../SpaceField";
import type { TaskPage } from "../TaskPage";
import type { FormattedTimePreferences } from "../FormattedTime";

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
export type Person = PersonField.Person;

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
  kanbanLink?: string;
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
  assignees: Person[];
  description?: RichTextJSON;
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
  reminders?: TaskPage.Reminder[];
  closedAt?: Date | null;
  hasDescription?: boolean;
  hasComments?: boolean;
  commentCount?: number;
  comments?: any[];
  type: "project" | "space";
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

export type StatusCustomizationStatus = StatusSelector.StatusOption;

export type TaskDisplayMode = "list" | "board";

export interface TaskListSlideInContext {
  tasks: Task[];
  statuses: StatusSelector.StatusOption[];
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onTaskRemindersChange?: TaskBoardProps["onTaskRemindersChange"];
  onTaskStatusChange?: TaskBoardProps["onTaskStatusChange"];
  onTaskMilestoneChange?: (taskId: string, milestone: Milestone | null) => void;
  onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  onTaskNameChange?: (taskId: string, name: string) => void;
  onTaskDelete?: (taskId: string) => void | Promise<unknown>;
  onMoveTask?: TaskPage.ContentProps["onMoveTask"];
  projectSearch?: ProjectField.SearchProjectFn;
  spaceSearch?: SpaceField.SearchSpaceFn;
  milestones?: Milestone[];
  onMilestoneSearch?: (query: string) => Promise<void>;
  assigneePersonSearch?: PersonField.SearchData;
  richTextHandlers?: RichEditorHandlers;
}

export interface TaskBoardProps {
  tasks: Task[];
  milestones?: Milestone[];
  searchableMilestones: Milestone[]; // Filtered milestones for task creation modal
  showMilestoneKanbanLink?: boolean;
  onTaskCreate: (task: NewTaskPayload) => void;
  onMilestoneCreate?: (milestone: NewMilestonePayload) => void;
  onTaskAssigneeChange: (taskId: string, assignees: Person[]) => void;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskRemindersChange?: (taskId: string, reminders: TaskPage.Reminder[]) => Promise<boolean> | boolean;
  onTaskStatusChange: (taskId: string, status: Status | null) => void;
  onTaskMilestoneChange?: (taskId: string, milestoneId: string | null, index: number) => void;
  onTaskNameChange?: (taskId: string, name: string) => void;
  onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  onTaskDelete?: (taskId: string) => void | Promise<unknown>;
  onMoveTask?: TaskPage.ContentProps["onMoveTask"];
  onMilestoneUpdate?: (milestoneId: string, updates: Partial<Milestone>) => void;
  onMilestoneSearch: (query: string) => Promise<void>;
  assigneePersonSearch?: PersonField.SearchData;
  projectSearch?: ProjectField.SearchProjectFn;
  spaceSearch?: SpaceField.SearchSpaceFn;
  richTextHandlers?: RichEditorHandlers;
  getTaskPageProps?: (taskId: string, ctx: TaskListSlideInContext) => TaskPage.ContentProps | null;

  // Filter functionality
  filters?: FilterCondition[];
  onFiltersChange?: (filters: FilterCondition[]) => void;

  // Status customization
  statuses: StatusSelector.StatusOption[];
  onSaveCustomStatuses: (data: {
    nextStatuses: StatusSelector.StatusOption[];
    deletedStatusReplacements: Record<string, string>;
  }) => void;
  canManageStatuses: boolean;
  canCreateMilestone: boolean;
  canCreateTask: boolean;

  displayMode: TaskDisplayMode;
  onDisplayModeChange: (mode: TaskDisplayMode) => void;
  formattedTimePreferences: FormattedTimePreferences;
}
