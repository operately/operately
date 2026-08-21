import React from "react";
import { KanbanBoard } from "./KanbanView";
import type { KanbanBoardProps } from "./KanbanView/types";
import { TasksMenu, TaskDisplayMenu } from "./components";
import {
  MilestoneViewSelector,
  type MilestoneViewSelectorMilestone,
} from "./components/MilestoneViewSelector";
import type { NewMilestonePayload } from "./types";
import type { TaskDisplayMode } from "./types";

export type TasksBoardViewProps = KanbanBoardProps & {
  displayMode: TaskDisplayMode;
  onDisplayModeChange: (mode: TaskDisplayMode) => void;
  selectedMilestone: MilestoneViewSelectorMilestone | null;
  onMilestoneFilterChange: (milestoneId: string | null) => void;
  canCreateMilestone: boolean;
  onCreateMilestone: (
    milestone: NewMilestonePayload,
  ) =>
    | void
    | { success?: boolean; milestone?: { id: string } }
    | Promise<void | { success?: boolean; milestone?: { id: string } }>;
  canManageStatuses: boolean;
  testId?: string;
};

export function TasksBoardView({
  displayMode,
  onDisplayModeChange,
  selectedMilestone,
  onMilestoneFilterChange,
  canCreateMilestone,
  onCreateMilestone,
  canManageStatuses,
  testId,
  milestones = [],
  statuses,
  onStatusesChange,
  ...kanbanProps
}: TasksBoardViewProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden" data-test-id={testId}>
      <div className="m-4 mb-0 flex flex-wrap items-center justify-between gap-3 px-1">
        <MilestoneViewSelector
          milestones={milestones}
          selectedMilestone={selectedMilestone}
          canCreateMilestone={canCreateMilestone}
          onChange={onMilestoneFilterChange}
          onCreateMilestone={onCreateMilestone}
        />
        <div className="flex items-center">
          <TasksMenu
            statuses={statuses}
            onSaveCustomStatuses={(data) => onStatusesChange?.(data)}
            canManageStatuses={canManageStatuses}
          />
          <TaskDisplayMenu mode={displayMode} onChange={onDisplayModeChange} />
        </div>
      </div>

      <KanbanBoard
        {...kanbanProps}
        milestones={milestones}
        statuses={statuses}
        onStatusesChange={onStatusesChange}
        unstyled
      />
    </div>
  );
}
