import { DateField } from "../DateField";
import { Person, Comment, CommentActivity } from "../CommentSection/types";

// Task-specific activity types
export interface TaskAssignmentActivity {
  id: string;
  type: "task_assignee_updating";
  author: Person;
  insertedAt: string;
  assignee: Person;
  action: "assigned" | "unassigned";
}

export interface TaskStatusChangeActivity {
  id: string;
  type: "task-status-change";
  author: Person;
  insertedAt: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  task?: Task; // Optional for backward compatibility
}

export interface TaskMilestoneActivity {
  id: string;
  type: "task-milestone";
  author: Person;
  insertedAt: string;
  milestone: Milestone;
  action: "attached" | "detached";
}

export interface TaskPriorityActivity {
  id: string;
  type: "task-priority";
  author: Person;
  insertedAt: string;
  fromPriority: TaskPriority;
  toPriority: TaskPriority;
}

export interface TaskDueDateActivity {
  id: string;
  type: "task_due_date_updating";
  author: Person;
  insertedAt: string;
  fromDueDate: DateField.ContextualDate | null;
  toDueDate: DateField.ContextualDate | null;
}

export interface TaskDescriptionActivity {
  id: string;
  type: "task_description_change";
  author: Person;
  insertedAt: string;
  hasContent: boolean; // Whether description was added/updated vs removed
}

export interface TaskTitleActivity {
  id: string;
  type: "task_name_updating";
  author: Person;
  insertedAt: string;
  fromTitle: string;
  toTitle: string;
}

export interface TaskCreationActivity {
  id: string;
  type: "task_adding";
  author: Person;
  insertedAt: string;
}

// Supporting types
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Milestone {
  id: string;
  title: string;
  dueDate?: string;
  status: "pending" | "complete";
}

export interface Task {
  id: string;
  title: string;
  status?: TaskStatus;
}

// Union type for all activities
export type TaskActivity = 
  | TaskAssignmentActivity
  | TaskStatusChangeActivity
  | TaskMilestoneActivity
  | TaskPriorityActivity
  | TaskDueDateActivity
  | TaskDescriptionActivity
  | TaskTitleActivity
  | TaskCreationActivity;

// Timeline item types
export type TimelineItem = {
  type: "comment";
  value: Comment;
} | {
  type: "task-activity";
  value: TaskActivity;
} | {
  type: "milestone-activity";
  value: CommentActivity;
} | {
  type: "acknowledgment";
  value: Person;
  insertedAt: string;
};

// Timeline component props
export interface TimelineProps {
  items: TimelineItem[];
  currentUser: Person;
  canComment: boolean;
  commentParentType: string;
  onAddComment?: (content: any) => void;
  onEditComment?: (id: string, content: any) => void;
  filters?: TimelineFilters;
}

export interface TimelineFilters {
  showComments: boolean;
  showActivities: boolean;
  authorFilter?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TimelineItemProps {
  item: TimelineItem;
  currentUser: Person;
  canComment: boolean;
  commentParentType: string;
  onEditComment?: (id: string, content: any) => void;
}

// Activity component props
export interface TaskActivityProps {
  activity: TaskActivity;
}