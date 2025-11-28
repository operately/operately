import type { StatusSelector } from "../../StatusSelector";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";

export type KanbanStatus = string;

export type MilestoneKanbanState = Record<KanbanStatus, string[]>;

export interface KanbanBoardProps {
  milestones: TaskBoard.Milestone[];
  tasks: TaskBoard.Task[];
  statuses: StatusSelector.StatusOption[];
  kanbanStateByMilestone: Record<string, MilestoneKanbanState>;
  onTaskKanbanChange?: (event: {
    taskId: string;
    from: { milestoneId: string | null; status: KanbanStatus; index: number };
    to: { milestoneId: string | null; status: KanbanStatus; index: number };
    updatedKanbanStateByMilestone: Record<string, MilestoneKanbanState>;
  }) => void | Promise<void>;
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onMilestoneUpdate?: TaskBoardProps["onMilestoneUpdate"];
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
}
