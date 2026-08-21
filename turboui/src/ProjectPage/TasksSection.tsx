import React from "react";

import { TaskBoard, TasksBoardView, useMilestoneFilter, useTaskDisplayMode } from "../TaskBoard";
import * as TaskBoardTypes from "../TaskBoard/types";

import type { ProjectPage } from "./index";

export function TasksSection({ state }: { state: ProjectPage.State }) {
  const { selectedMilestone, tasks, onMilestoneFilterChange } = useMilestoneFilter({
    milestones: state.milestones,
    tasks: state.tasks,
  });

  const canPersistTasksView = state.permissions.canEdit || false;
  const [taskDisplayMode, setTaskDisplayMode] = useTaskDisplayMode({
    tasksView: state.tasksView,
    canPersistTasksView,
    onTasksViewChange: state.onTasksViewChange,
  });

  const onKanbanTaskCreate = React.useCallback(
    (task: TaskBoardTypes.NewTaskPayload) => {
      if (!selectedMilestone) {
        return state.onTaskCreate(task);
      }

      return state.onTaskCreate({
        ...task,
        milestone: selectedMilestone,
      });
    },
    [selectedMilestone, state.onTaskCreate],
  );

  const handleTaskMilestoneChange = React.useCallback(
    (taskId: string, milestone: TaskBoardTypes.Milestone | null) => {
      const indexInMilestone = 1000;
      const milestoneId = milestone?.id ?? null;

      state.onTaskMilestoneChange?.(taskId, milestoneId, indexInMilestone);
    },
    [state.onTaskMilestoneChange],
  );

  const handleDisplayModeChange = React.useCallback(
    (mode: TaskBoardTypes.TaskDisplayMode) => {
      setTaskDisplayMode(mode);

      if (mode === "list") {
        onMilestoneFilterChange(null);
      }
    },
    [onMilestoneFilterChange, setTaskDisplayMode],
  );

  const canEdit = state.permissions.canEdit || false;

  if (taskDisplayMode === "board") {
    return (
      <TasksBoardView
        displayMode={taskDisplayMode}
        onDisplayModeChange={handleDisplayModeChange}
        selectedMilestone={selectedMilestone}
        onMilestoneFilterChange={onMilestoneFilterChange}
        canCreateMilestone={canEdit}
        onCreateMilestone={state.onMilestoneCreate}
        canManageStatuses={canEdit}
        tasks={tasks}
        statuses={state.statuses}
        kanbanState={state.kanbanState}
        onTaskKanbanChange={state.onTaskKanbanChange}
        onTaskCreate={onKanbanTaskCreate}
        onTaskNameChange={state.onTaskNameChange}
        onTaskAssigneeChange={state.onTaskAssigneeChange}
        onTaskDueDateChange={state.onTaskDueDateChange}
        onTaskRemindersChange={state.onTaskRemindersChange}
        onTaskStatusChange={state.onTaskStatusChange}
        onTaskMilestoneChange={handleTaskMilestoneChange}
        onTaskDelete={state.onTaskDelete}
        milestones={state.milestones}
        onMilestoneSearch={state.onMilestoneSearch}
        onTaskDescriptionChange={state.onTaskDescriptionChange}
        richTextHandlers={state.richTextHandlers}
        assigneePersonSearch={state.assigneePersonSearch}
        getTaskPageProps={state.getTaskPageProps}
        canEdit={canEdit}
        onStatusesChange={state.onSaveCustomStatuses}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden pt-1">
      <TaskBoard
        tasks={tasks}
        milestones={state.milestones}
        searchableMilestones={state.searchableMilestones}
        showMilestoneKanbanLink={state.showMilestoneKanbanLink}
        onTaskCreate={state.onTaskCreate}
        onMilestoneCreate={state.onMilestoneCreate}
        onTaskAssigneeChange={state.onTaskAssigneeChange}
        onTaskDueDateChange={state.onTaskDueDateChange}
        onTaskRemindersChange={state.onTaskRemindersChange}
        onTaskStatusChange={state.onTaskStatusChange}
        onTaskMilestoneChange={state.onTaskMilestoneChange}
        onTaskNameChange={state.onTaskNameChange}
        onTaskDescriptionChange={state.onTaskDescriptionChange}
        onTaskDelete={state.onTaskDelete}
        onMilestoneUpdate={state.onMilestoneUpdate}
        onMilestoneSearch={state.onMilestoneSearch}
        assigneePersonSearch={state.assigneePersonSearch}
        richTextHandlers={state.richTextHandlers}
        getTaskPageProps={state.getTaskPageProps}
        filters={state.filters}
        onFiltersChange={state.onFiltersChange}
        statuses={state.statuses}
        canManageStatuses={canEdit}
        canCreateMilestone={canEdit}
        canCreateTask={canEdit}
        onSaveCustomStatuses={state.onSaveCustomStatuses}
        displayMode={taskDisplayMode}
        onDisplayModeChange={handleDisplayModeChange}
        formattedTimePreferences={state.formattedTimePreferences}
      />
    </div>
  );
}
