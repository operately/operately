import type { StatusSelector } from "../../StatusSelector";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import type { RichEditorHandlers } from "../../RichEditor/useEditor";
import type { TaskPage } from "../../TaskPage";

export type KanbanStatus = string;

export type KanbanState = Record<KanbanStatus, string[]>;

export type GetTaskPageProps = (taskId: string, ctx: TaskSlideInContext) => TaskPage.ContentProps | null;

export interface TaskSlideInContext {
  milestone?: TaskBoard.Milestone;
  tasks: TaskBoard.Task[];
  statuses: StatusSelector.StatusOption[];
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onTaskStatusChange?: TaskBoardProps["onTaskStatusChange"];
  onTaskMilestoneChange?: (taskId: string, milestone: TaskBoard.Milestone | null) => void;
  onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  onTaskNameChange?: (taskId: string, name: string) => void;
  onTaskDelete?: (taskId: string) => void | Promise<void>;
  milestones?: TaskBoard.Milestone[];
  onMilestoneSearch?: (query: string) => Promise<void>;
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  richTextHandlers?: RichEditorHandlers;
}

export interface KanbanBoardProps {
  milestone?: TaskBoard.Milestone;
  tasks: TaskBoard.Task[];
  statuses: StatusSelector.StatusOption[];
  kanbanState: KanbanState;
  canManageStatuses?: boolean;
  canCreateTask: boolean;
  onStatusesChange?: (data: {
    nextStatuses: StatusSelector.StatusOption[];
    deletedStatusReplacements: Record<string, string>;
  }) => void;
  onTaskKanbanChange?: (event: {
    milestoneId: string | null;
    taskId: string;
    from: { status: KanbanStatus; index: number };
    to: { status: KanbanStatus; index: number };
    updatedKanbanState: KanbanState;
  }) => void | Promise<void>;
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onTaskStatusChange?: TaskBoardProps["onTaskStatusChange"];
  onTaskMilestoneChange?: (taskId: string, milestone: TaskBoard.Milestone | null) => void;
  onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  onTaskNameChange?: (taskId: string, name: string) => void;
  onTaskDelete?: (taskId: string) => void | Promise<any>;
  milestones?: TaskBoard.Milestone[];
  onMilestoneSearch?: (query: string) => Promise<void>;
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  richTextHandlers?: RichEditorHandlers;
  getTaskPageProps: GetTaskPageProps;
  unstyled?: boolean;
}
