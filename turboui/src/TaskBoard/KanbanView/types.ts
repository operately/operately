import type { StatusSelector } from "../../StatusSelector";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import type { RichEditorHandlers } from "../../RichEditor/useEditor";
import type { TaskPage } from "../../TaskPage";
import type { TemplateProjectPage } from "../../TemplateProjectPage";
import type { PersonField } from "../../PersonField";
import type { ProjectField } from "../../ProjectField";
import type { SpaceField } from "../../SpaceField";
import type { FormattedTimePreferences } from "../../FormattedTime";
import type { ReactNode } from "react";

export type KanbanStatus = string;

export type KanbanState = Record<KanbanStatus, string[]>;

export interface KanbanToolbarContext {
  closedStatuses: {
    count: number;
    visible: boolean;
    onVisibilityChange: (visible: boolean) => void;
  };
}

export type GetTaskPageProps = (taskId: string, ctx: TaskSlideInContext) => TaskPage.ContentProps | null;

export type GetTemplateTaskPageProps = (
  taskId: string,
  ctx: TemplateTaskSlideInContext,
) => TaskPage.ContentProps | null;

export interface TemplateTaskSlideInContext {
  milestoneId?: string;
  tasks: TemplateProjectPage.Task[];
  milestones: TemplateProjectPage.Milestone[];
  statuses: StatusSelector.StatusOption[];
  onTaskCreate?: (task: Omit<TemplateProjectPage.Task, "id">) => void;
  onTaskUpdate?: (
    taskId: string,
    updates: Partial<TemplateProjectPage.Task>,
  ) => void | boolean | Promise<void | boolean>;
  onTaskDelete?: (taskId: string) => void | boolean | Promise<void | boolean>;
  onTaskReorder?: (
    taskId: string,
    milestoneId: string | null,
    destinationIndex: number,
  ) => void | boolean | Promise<void | boolean>;
  personSearch?: PersonField.SearchData;
  richTextHandlers?: RichEditorHandlers;
  canEdit?: boolean;
  formattedTimePreferences?: FormattedTimePreferences;
}

export interface TaskSlideInContext {
  milestone?: TaskBoard.Milestone;
  tasks: TaskBoard.Task[];
  statuses: StatusSelector.StatusOption[];
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onTaskRemindersChange?: TaskBoardProps["onTaskRemindersChange"];
  onTaskStatusChange?: TaskBoardProps["onTaskStatusChange"];
  onTaskMilestoneChange?: (taskId: string, milestone: TaskBoard.Milestone | null) => void;
  onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  onTaskNameChange?: (taskId: string, name: string) => void;
  onTaskDelete?: (taskId: string) => void | Promise<unknown>;
  onMoveTask?: TaskPage.ContentProps["onMoveTask"];
  projectSearch?: ProjectField.SearchProjectFn;
  spaceSearch?: SpaceField.SearchSpaceFn;
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
  canEdit: boolean;
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
  }) => void | boolean | Promise<void | boolean>;
  onTaskCreate?: TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onTaskDueOffsetDaysChange?: TaskBoardProps["onTaskDueOffsetDaysChange"];
  onTaskRemindersChange?: TaskBoardProps["onTaskRemindersChange"];
  onTaskStatusChange?: TaskBoardProps["onTaskStatusChange"];
  onTaskMilestoneChange?: (taskId: string, milestone: TaskBoard.Milestone | null) => void;
  onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
  onTaskNameChange?: (taskId: string, name: string) => void;
  onTaskDelete?: (taskId: string) => void | Promise<any>;
  onMoveTask?: TaskPage.ContentProps["onMoveTask"];
  projectSearch?: ProjectField.SearchProjectFn;
  spaceSearch?: SpaceField.SearchSpaceFn;
  milestones?: TaskBoard.Milestone[];
  onMilestoneSearch?: (query: string) => Promise<void>;
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
  richTextHandlers?: RichEditorHandlers;
  getTaskPageProps: GetTaskPageProps;
  unstyled?: boolean;
  toolbarLeading?: ReactNode;
  toolbarActions?: ReactNode | ((context: KanbanToolbarContext) => ReactNode);
}
