import type { StatusSelector } from "../../StatusSelector";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";

export type KanbanStatus = string;

export type MilestoneKanbanState = Record<KanbanStatus, string[]>;

export interface KanbanBoardProps {
  milestone: TaskBoard.Milestone;
  tasks: TaskBoard.Task[];
  statuses: StatusSelector.StatusOption[];
  kanbanState: MilestoneKanbanState;
  canManageStatuses?: boolean;
  onStatusesChange?: (statuses: StatusSelector.StatusOption[]) => void;
  onTaskKanbanChange?: (event: {
    milestoneId: string | null;
    taskId: string;
    from: { status: KanbanStatus; index: number };
    to: { status: KanbanStatus; index: number };
    updatedKanbanState: MilestoneKanbanState;
  }) => void | Promise<void>;
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onTaskStatusChange?: TaskBoardProps["onTaskStatusChange"];
  onTaskMilestoneChange?: (taskId: string, milestone: TaskBoard.Milestone | null) => void;
  onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  onTaskNameChange?: (taskId: string, name: string) => void;
  milestones?: TaskBoard.Milestone[];
  onMilestoneSearch?: (query: string) => Promise<void>;
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  unstyled?: boolean;
}
