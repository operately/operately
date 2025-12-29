import React from "react";

import { KanbanBoard, TaskBoard, TaskDisplayMenu } from "../TaskBoard";
import type { KanbanState } from "../TaskBoard/KanbanView/types";
import * as TaskBoardTypes from "../TaskBoard/types";
import { useStateWithLocalStorage } from "../utils/useStateWithLocalStorage";

import type { ProjectPage } from "./index";

export function TasksSection({ state }: { state: ProjectPage.State }) {
  const emptyKanbanState = React.useMemo<KanbanState>(() => ({}), []);
  const handleTaskKanbanChange = React.useCallback(() => {}, []);
  const handleTaskNameChange = React.useCallback(() => {}, []);
  const handleTaskDescriptionChange = React.useCallback(async () => true, []);
  const handleTaskDelete = React.useCallback(async () => {}, []);
  const handleTaskPageProps = React.useCallback(() => null, []);

  const handleTaskMilestoneChange = React.useCallback(
    (taskId: string, milestone: TaskBoardTypes.Milestone | null) => {
      if (!milestone) return;
      state.onTaskMilestoneChange?.(taskId, milestone.id, 0);
    },
    [state.onTaskMilestoneChange],
  );

  const projectDisplayStorageKey = React.useMemo(() => {
    return normalizeStorageKeyPart(state.project.id);
  }, [state.project.id]);

  const [taskDisplayMode, setTaskDisplayMode] = useStateWithLocalStorage<TaskBoardTypes.TaskDisplayMode>(
    "project-task-display",
    projectDisplayStorageKey,
    "list",
  );

  if (taskDisplayMode === "board") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 m-4 mb-0">
          <button type="button" className="text-sm font-medium text-content-dimmed hover:text-content-base transition">
            All milestones
          </button>
          <TaskDisplayMenu mode={taskDisplayMode} onChange={setTaskDisplayMode} />
        </div>

        <KanbanBoard
          tasks={state.tasks}
          statuses={state.statuses}
          kanbanState={emptyKanbanState}
          onTaskKanbanChange={handleTaskKanbanChange}
          onTaskCreate={state.onTaskCreate}
          onTaskNameChange={handleTaskNameChange}
          onTaskAssigneeChange={state.onTaskAssigneeChange}
          onTaskDueDateChange={state.onTaskDueDateChange}
          onTaskStatusChange={state.onTaskStatusChange}
          onTaskMilestoneChange={handleTaskMilestoneChange}
          onTaskDelete={handleTaskDelete}
          milestones={state.milestones}
          onMilestoneSearch={state.onMilestoneSearch}
          onTaskDescriptionChange={handleTaskDescriptionChange}
          richTextHandlers={state.richTextHandlers}
          assigneePersonSearch={state.assigneePersonSearch}
          getTaskPageProps={handleTaskPageProps}
          canManageStatuses={state.canManageStatuses}
          onStatusesChange={state.onSaveCustomStatuses}
          unstyled
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden pt-1">
      <TaskBoard
        tasks={state.tasks}
        milestones={state.milestones}
        searchableMilestones={state.searchableMilestones}
        showMilestoneKanbanLink={state.showMilestoneKanbanLink}
        onTaskCreate={state.onTaskCreate}
        onMilestoneCreate={state.onMilestoneCreate}
        onTaskAssigneeChange={state.onTaskAssigneeChange}
        onTaskDueDateChange={state.onTaskDueDateChange}
        onTaskStatusChange={state.onTaskStatusChange}
        onTaskMilestoneChange={state.onTaskMilestoneChange}
        onMilestoneUpdate={state.onMilestoneUpdate}
        onMilestoneSearch={state.onMilestoneSearch}
        assigneePersonSearch={state.assigneePersonSearch}
        filters={state.filters}
        onFiltersChange={state.onFiltersChange}
        statuses={state.statuses}
        canManageStatuses={state.canManageStatuses}
        onSaveCustomStatuses={state.onSaveCustomStatuses}
        displayMode={taskDisplayMode}
        onDisplayModeChange={setTaskDisplayMode}
        kanbanEnabled={state.kanbanEnabled}
      />
    </div>
  );
}

function normalizeStorageKeyPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}