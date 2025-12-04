import React from "react";

import { DateField } from "../DateField";
import { PersonField } from "../PersonField";
import { PageNew } from "../Page";
import { KanbanBoard } from "../TaskBoard";
import * as Types from "../TaskBoard/types";
import type { KanbanBoardProps, MilestoneKanbanState } from "../TaskBoard/KanbanView/types";

export namespace MilestoneKanbanPage {
  export type Milestone = Types.Milestone;

  export interface Props {
    projectName: string;

    // Kanban data
    milestone: Milestone | null;
    tasks: Types.Task[];
    statuses: Types.Status[];
    kanbanState: MilestoneKanbanState;

    canManageStatuses?: boolean;
    onStatusesChange?: (statuses: Types.Status[]) => void;

    // Callbacks
    assigneePersonSearch: PersonField.SearchData;
    onTaskKanbanChange?: KanbanBoardProps["onTaskKanbanChange"];
    onTaskCreate?: (task: Types.NewTaskPayload) => void;
    onTaskAssigneeChange: (taskId: string, assignee: Types.Person | null) => void;
    onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onMilestoneUpdate?: (milestoneId: string, updates: Types.UpdateMilestonePayload) => void;
  }
}

export function MilestoneKanbanPage(props: MilestoneKanbanPage.Props) {
  return (
    <PageNew title={props.projectName} size="fullwidth">
      <div className="flex-1 overflow-auto px-2 py-4">
        <KanbanBoard
          milestone={props.milestone}
          tasks={props.tasks}
          statuses={props.statuses}
          kanbanState={props.kanbanState}
          onTaskKanbanChange={props.onTaskKanbanChange}
          onTaskCreate={props.onTaskCreate}
          onTaskAssigneeChange={props.onTaskAssigneeChange}
          onTaskDueDateChange={props.onTaskDueDateChange}
          onMilestoneUpdate={props.onMilestoneUpdate}
          assigneePersonSearch={props.assigneePersonSearch}
          canManageStatuses={props.canManageStatuses ?? false}
          onStatusesChange={props.onStatusesChange}
        />
      </div>
    </PageNew>
  );
}
