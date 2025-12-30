import React from "react";

import { KanbanBoard, TaskBoard, TasksMenu, TaskDisplayMenu } from "../TaskBoard";
import * as TaskBoardTypes from "../TaskBoard/types";
import { useStateWithLocalStorage } from "../utils/useStateWithLocalStorage";

import type { ProjectPage } from "./index";

export function TasksSection({ state }: { state: ProjectPage.State }) {
  const handleTaskMilestoneChange = React.useCallback(
    (taskId: string, milestone: TaskBoardTypes.Milestone | null) => {
      const indexInMilestone = 1000;
      const milestoneId = milestone?.id ?? "no-milestone";

      state.onTaskMilestoneChange?.(taskId, milestoneId, indexInMilestone);
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
        <div className="flex items-center justify-between gap-3 m-4 px-1 mb-0">
          <button type="button" className="text-sm font-medium text-content-dimmed hover:text-content-base transition">
            All milestones
          </button>
          <div className="flex items-center">
            <TasksMenu
              statuses={state.statuses}
              onSaveCustomStatuses={state.onSaveCustomStatuses}
              canManageStatuses={state.canManageStatuses}
            />
            <TaskDisplayMenu mode={taskDisplayMode} onChange={setTaskDisplayMode} />
          </div>
        </div>

        <KanbanBoard
          tasks={state.tasks}
          statuses={state.statuses}
          kanbanState={state.kanbanState}
          onTaskKanbanChange={state.onTaskKanbanChange}
          onTaskCreate={state.onTaskCreate}
          onTaskNameChange={state.onTaskNameChange}
          onTaskAssigneeChange={state.onTaskAssigneeChange}
          onTaskDueDateChange={state.onTaskDueDateChange}
          onTaskStatusChange={state.onTaskStatusChange}
          onTaskMilestoneChange={handleTaskMilestoneChange}
          onTaskDelete={state.onTaskDelete}
          milestones={state.milestones}
          onMilestoneSearch={state.onMilestoneSearch}
          onTaskDescriptionChange={state.onTaskDescriptionChange}
          richTextHandlers={state.richTextHandlers}
          assigneePersonSearch={state.assigneePersonSearch}
          getTaskPageProps={state.getTaskPageProps}
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