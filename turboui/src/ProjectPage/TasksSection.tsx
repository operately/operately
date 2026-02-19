import React from "react";
import { useSearchParams } from "react-router-dom";

import { KanbanBoard, TaskBoard, TasksMenu, TaskDisplayMenu } from "../TaskBoard";
import * as TaskBoardTypes from "../TaskBoard/types";
import { Menu, MenuActionItem } from "../Menu";
import { IconFlag } from "../icons";
import { compareIds } from "../utils/ids";
import { useLocalStorage } from "../utils/useLocalStorage";

import type { ProjectPage } from "./index";

export function TasksSection({ state }: { state: ProjectPage.State }) {
  const { selectedMilestone, tasks, onMilestoneFilterChange } = useMilestoneFilter({
    milestones: state.milestones,
    tasks: state.tasks,
  });

  const projectDisplayStorageKey = React.useMemo(() => {
    return normalizeStorageKeyPart(state.project.id);
  }, [state.project.id]);

  const [taskDisplayMode, setTaskDisplayMode] = useTaskDisplayMode({
    storageKey: projectDisplayStorageKey,
  });

  // When creating tasks from the kanban, create them within the selected milestone (if any).
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
      const milestoneId = milestone?.id ?? "no-milestone";

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
              canManageStatuses={state.permissions.canEdit}
            />
            <TaskDisplayMenu mode={taskDisplayMode} onChange={handleDisplayModeChange} />
          </div>
        </div>

        <KanbanBoard
          tasks={tasks}
          statuses={state.statuses}
          kanbanState={state.kanbanState}
          onTaskKanbanChange={state.onTaskKanbanChange}
          onTaskCreate={onKanbanTaskCreate}
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
          canEdit={state.permissions.canEdit}
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
        canManageStatuses={state.permissions.canEdit}
        canCreateMilestone={state.permissions.canEdit}
        canCreateTask={state.permissions.canEdit}
        onSaveCustomStatuses={state.onSaveCustomStatuses}
        displayMode={taskDisplayMode}
        onDisplayModeChange={handleDisplayModeChange}
      />
    </div>
  );
}

const TASK_DISPLAY_MODE_PARAM = "taskDisplay";
const TASK_DISPLAY_STORAGE_NAMESPACE = "project-task-display";

function useTaskDisplayMode({ storageKey }: { storageKey: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fullStorageKey = `${TASK_DISPLAY_STORAGE_NAMESPACE}:${storageKey}`;

  const readStoredMode = React.useCallback(() => {
    const { getItem, setItem } = useLocalStorage(fullStorageKey);
    const storedValue = getItem();

    if (storedValue === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(storedValue);
      const mode = parseTaskDisplayMode(parsed);

      if (!mode) {
        setItem(null);
      }

      return mode;
    } catch (error) {
      console.error(`Error reading localStorage key "${fullStorageKey}":`, error);
      setItem(null);
      return null;
    }
  }, [fullStorageKey]);

  const writeStoredMode = React.useCallback(
    (mode: TaskBoardTypes.TaskDisplayMode) => {
      const { setItem } = useLocalStorage(fullStorageKey);

      try {
        setItem(JSON.stringify(mode));
      } catch (error) {
        console.error(`Error writing localStorage key "${fullStorageKey}":`, error);
      }
    },
    [fullStorageKey],
  );

  const [mode, setModeState] = React.useState<TaskBoardTypes.TaskDisplayMode>(() => {
    const urlMode = parseTaskDisplayMode(searchParams.get(TASK_DISPLAY_MODE_PARAM));
    const storedMode = readStoredMode();

    return urlMode ?? storedMode ?? "list";
  });

  React.useEffect(() => {
    const rawUrlValue = searchParams.get(TASK_DISPLAY_MODE_PARAM);

    if (!rawUrlValue) {
      return;
    }

    const urlMode = parseTaskDisplayMode(rawUrlValue);

    if (urlMode) {
      if (mode !== urlMode) {
        setModeState(urlMode);
      }

      writeStoredMode(urlMode);
    }

    const next = new URLSearchParams(searchParams);
    next.delete(TASK_DISPLAY_MODE_PARAM);
    setSearchParams(next, { replace: true });
  }, [mode, searchParams, setSearchParams, writeStoredMode]);

  const setMode = React.useCallback(
    (nextMode: TaskBoardTypes.TaskDisplayMode) => {
      setModeState(nextMode);
      writeStoredMode(nextMode);
    },
    [writeStoredMode],
  );

  return [mode, setMode] as const;
}

const parseTaskDisplayMode = (value: unknown): TaskBoardTypes.TaskDisplayMode | null => {
  if (value === "list" || value === "board") return value;
  return null;
};

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
          className="flex items-center gap-1.5 text-sm font-medium text-content-dimmed hover:text-content-base transition px-2 py-1 -mx-2 rounded-md hover:bg-surface-dimmed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-outline"
          data-test-id="current-milestone"
        >
          <IconFlag size={18} className="flex-shrink-0" />
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
    return tasks.filter((task) => compareIds(task.milestone?.id, selectedMilestoneId));
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
