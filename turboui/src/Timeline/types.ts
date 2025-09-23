import { DateField } from "../DateField";
import { Person, Comment, MilestoneActivity } from "../CommentSection/types";
import { Status } from "../TaskBoard/types";
import { RichEditorHandlers } from "../RichEditor/useEditor";

export type ActivityPageContext = "task" | "milestone";

// Task-specific activity types
export interface TaskAssignmentActivity {
  id: string;
  type: "task_assignee_updating";
  author: Person;
  insertedAt: string;
  assignee: Person;
  action: "assigned" | "unassigned";
  taskName: string;
  page: ActivityPageContext;
}

export interface TaskStatusChangeActivity {
  id: string;
  type: "task_status_updating";
  author: Person;
  insertedAt: string;
  fromStatus: Status;
  toStatus: Status;
  taskName: string;
  page: ActivityPageContext;
  task?: Task;
}

export interface TaskMilestoneActivity {
  id: string;
  type: "task_milestone_updating";
  author: Person;
  insertedAt: string;
  milestone: Milestone;
  action: "attached" | "detached";
  taskName: string;
  page: ActivityPageContext;
}

export interface TaskPriorityActivity {
  id: string;
  type: "task-priority";
  author: Person;
  insertedAt: string;
  fromPriority: TaskPriority;
  toPriority: TaskPriority;
  taskName: string;
  page: ActivityPageContext;
}

export interface TaskDueDateActivity {
  id: string;
  type: "task_due_date_updating";
  author: Person;
  insertedAt: string;
  fromDueDate: DateField.ContextualDate | null;
  toDueDate: DateField.ContextualDate | null;
  taskName: string;
  page: ActivityPageContext;
}

export interface TaskDescriptionActivity {
  id: string;
  type: "task_description_change";
  author: Person;
  insertedAt: string;
  hasContent: boolean; // Whether description was added/updated vs removed
  taskName: string;
  page: ActivityPageContext;
}

export interface TaskTitleActivity {
  id: string;
  type: "task_name_updating";
  author: Person;
  insertedAt: string;
  fromTitle: string;
  toTitle: string;
  page: ActivityPageContext;
}

export interface TaskCreationActivity {
  id: string;
  type: "task_adding";
  author: Person;
  insertedAt: string;
  taskName: string;
  page: ActivityPageContext;
}

// Supporting types
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Milestone {
  id: string;
  name: string;
  dueDate: DateField.ContextualDate | null;
  status: "pending" | "done";
}

export interface Task {
  id: string;
  title: string;
  status?: Status;
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
export type TimelineItem =
  | {
      type: "comment";
      value: Comment;
    }
  | {
      type: "task-activity";
      value: TaskActivity;
    }
  | {
      type: "milestone-activity";
      value: MilestoneActivity;
    }
  | {
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
  onAddComment: (content: any) => void;
  onEditComment: (id: string, content: any) => void;
  filters?: TimelineFilters;
  richTextHandlers: RichEditorHandlers;
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
  onEditComment: (id: string, content: any) => void;
  richTextHandlers: RichEditorHandlers;
}

// Activity component props
export interface TaskActivityProps {
  activity: TaskActivity;
}
