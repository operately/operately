import React from "react";
import { useSearchParams } from "react-router-dom";

import { KanbanBoard, TaskBoard, TasksMenu, TaskDisplayMenu } from "../TaskBoard";
import * as TaskBoardTypes from "../TaskBoard/types";
import { Menu, MenuActionItem } from "../Menu";
import { useStateWithLocalStorage } from "../utils/useStateWithLocalStorage";

import type { ProjectPage } from "./index";

export function TasksSection({ state }: { state: ProjectPage.State }) {
  const { selectedMilestone, tasks, onMilestoneFilterChange } = useMilestoneFilter({
    milestones: state.milestones,
    tasks: state.tasks,
  });

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
          <MilestoneFilter
            milestones={state.milestones}
            selectedMilestone={selectedMilestone}
            onChange={onMilestoneFilterChange}
          />
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
          tasks={tasks}
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
        tasks={tasks}
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

function MilestoneFilter({
  milestones,
  selectedMilestone,
  onChange,
}: {
  milestones: TaskBoardTypes.Milestone[];
  selectedMilestone: TaskBoardTypes.Milestone | null;
  onChange: (milestoneId: string | null) => void;
}) {
  return (
    <Menu
      customTrigger={
        <button
          type="button"
          className="text-sm font-medium text-content-dimmed hover:text-content-base transition px-2 py-1 -mx-2 rounded-md hover:bg-surface-dimmed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-outline"
        >
          {selectedMilestone?.name ?? "All milestones"}
        </button>
      }
      size="small"
      align="start"
    >
      <MenuActionItem onClick={() => onChange(null)}>All milestones</MenuActionItem>
      {milestones.map((milestone) => (
        <MenuActionItem key={milestone.id} onClick={() => onChange(milestone.id)}>
          {milestone.name}
        </MenuActionItem>
      ))}
    </Menu>
  );
}

function useMilestoneFilter({
  milestones,
  tasks,
}: {
  milestones: TaskBoardTypes.Milestone[];
  tasks: TaskBoardTypes.Task[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const milestonesById = React.useMemo(() => {
    const map = new Map<string, TaskBoardTypes.Milestone>();
    milestones.forEach((m) => map.set(m.id, m));
    return map;
  }, [milestones]);

  const milestoneIdFromUrl = React.useMemo(() => {
    const value = searchParams.get("milestone");
    return value && value.length > 0 ? value : null;
  }, [searchParams]);

  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!milestoneIdFromUrl) {
      setSelectedMilestoneId(null);
      return;
    }

    if (milestonesById.has(milestoneIdFromUrl)) {
      setSelectedMilestoneId(milestoneIdFromUrl);
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete("milestone");
    setSearchParams(next, { replace: true });
    setSelectedMilestoneId(null);
  }, [milestoneIdFromUrl, milestonesById, searchParams, setSearchParams]);

  const selectedMilestone = React.useMemo(() => {
    if (!selectedMilestoneId) return null;
    return milestonesById.get(selectedMilestoneId) ?? null;
  }, [milestonesById, selectedMilestoneId]);

  const filteredTasks = React.useMemo(() => {
    if (!selectedMilestoneId) return tasks;
    return tasks.filter((task) => task.milestone?.id === selectedMilestoneId);
  }, [selectedMilestoneId, tasks]);

  const onMilestoneFilterChange = React.useCallback(
    (nextMilestoneId: string | null) => {
      const next = new URLSearchParams(searchParams);

      if (nextMilestoneId) {
        next.set("milestone", nextMilestoneId);
      } else {
        next.delete("milestone");
      }

      setSearchParams(next, { replace: true });
      setSelectedMilestoneId(nextMilestoneId);
    },
    [searchParams, setSearchParams],
  );

  return {
    selectedMilestone,
    selectedMilestoneId,
    tasks: filteredTasks,
    onMilestoneFilterChange,
  };
}

function normalizeStorageKeyPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}
