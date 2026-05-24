import * as React from "react";

import Api, { type TaskStatus } from "@/api";
import { MilestoneKanbanPage, SpaceKanbanPage, showErrorToast } from "turboui";
import { compareIds } from "@/routes/paths";

import { serializeTaskStatus } from "./index";
import { parseKanbanState, type KanbanState } from "./parseKanbanState";

interface TaskKanbanChangeEvent {
  taskId: string;
  from: { status: string; index: number };
  to: { status: string; index: number };
  updatedKanbanState: KanbanState;
}

type StatusOption = MilestoneKanbanPage.StatusOption | SpaceKanbanPage.StatusOption;
type Task = MilestoneKanbanPage.Task | SpaceKanbanPage.Task;

interface BaseKanbanStateOptions {
  initialRawState: unknown;
  statuses: StatusOption[];
  tasks: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  onSuccess?: () => Promise<void> | void;
}

type UseKanbanStateOptions =
  | (BaseKanbanStateOptions & {
      type: "milestone";
      milestoneId: string;
    })
  | (BaseKanbanStateOptions & {
      type: "space";
      spaceId: string;
    })
  | (BaseKanbanStateOptions & {
      type: "project";
      projectId: string;
    });

export function useKanbanState(options: UseKanbanStateOptions) {
  const { initialRawState, statuses, tasks, type, setTasks, onSuccess } = options;

  const [kanbanState, setKanbanState] = React.useState<KanbanState>(() =>
    parseKanbanState(initialRawState, statuses, tasks),
  );

  const hasOptimisticUpdateRef = React.useRef(false);

  React.useEffect(() => {
    if (hasOptimisticUpdateRef.current) {
      hasOptimisticUpdateRef.current = false;
      return;
    }
    setKanbanState(parseKanbanState(initialRawState, statuses, tasks));
  }, [initialRawState, statuses, tasks]);

  const persistTaskKanbanChange = React.useCallback(
    async (event: TaskKanbanChangeEvent): Promise<boolean> => {
      const previousState = kanbanState;
      const statusOption = statuses.find((s) => s.value === event.to.status) ?? null;
      const backendStatus = validateStatusForBackend(statusOption);

      if (!backendStatus) return false;

      hasOptimisticUpdateRef.current = true;
      setKanbanState(event.updatedKanbanState);
      applyOptimisticTaskStatusUpdate(event.taskId, statusOption, setTasks);

      try {
        if (type === "milestone") {
          await Api.projects.updateMilestoneKanban({
            milestoneId: options.milestoneId,
            taskId: event.taskId,
            status: backendStatus,
            kanbanState: serializeKanbanState(event.updatedKanbanState),
          });
        } else if (type === "project") {
          await Api.projects.updateKanban({
            projectId: options.projectId,
            taskId: event.taskId,
            status: backendStatus,
            kanbanState: serializeKanbanState(event.updatedKanbanState),
          });
        } else {
          await Api.spaces.updateKanban({
            spaceId: options.spaceId,
            taskId: event.taskId,
            status: backendStatus,
            kanbanState: serializeKanbanState(event.updatedKanbanState),
          });
        }

        if (onSuccess) {
          await onSuccess();
        }

        return true;
      } catch (e) {
        console.error("Failed to update Kanban state", e);
        showErrorToast("Error", "Failed to update task position");
        setKanbanState(previousState);
        return false;
      }
    },
    [kanbanState, onSuccess, options, setTasks, statuses, type],
  );

  const handleTaskKanbanChange = React.useCallback(
    async (event: TaskKanbanChangeEvent) => {
      return persistTaskKanbanChange(event);
    },
    [persistTaskKanbanChange],
  );

  const handleTaskStatusChange = React.useCallback(
    async (taskId: string, nextStatus: StatusOption | null) => {
      const event = buildTaskStatusChangeKanbanEvent({ taskId, nextStatus, kanbanState, statuses, tasks });

      if (!event) return false;

      return persistTaskKanbanChange(event);
    },
    [kanbanState, persistTaskKanbanChange, statuses, tasks],
  );

  return { kanbanState, handleTaskKanbanChange, handleTaskStatusChange };
}

export function buildTaskStatusChangeKanbanEvent({
  taskId,
  nextStatus,
  kanbanState,
  statuses,
  tasks,
}: {
  taskId: string;
  nextStatus: StatusOption | null;
  kanbanState: KanbanState;
  statuses: StatusOption[];
  tasks: Task[];
}): TaskKanbanChangeEvent | null {
  const statusOption = resolveStatusOption(nextStatus, statuses);
  if (!statusOption || statusOption.value === "unknown-status") return null;

  const statusKeys = statuses.map((status) => status.value);
  const destinationStatus = statusOption.value;
  const from = findTaskKanbanPosition(kanbanState, taskId, statusKeys, tasks);
  const withoutTask = removeTaskFromKanbanState(kanbanState, taskId, statusKeys);
  const destinationIndex = isClosedStatus(statusOption) ? 0 : withoutTask[destinationStatus]?.length || 0;
  const updatedKanbanState = insertTaskIntoKanbanState(withoutTask, taskId, destinationStatus, destinationIndex);

  return {
    taskId,
    from,
    to: { status: destinationStatus, index: destinationIndex },
    updatedKanbanState,
  };
}

function resolveStatusOption(status: StatusOption | null, statuses: StatusOption[]): StatusOption | null {
  if (!status) return null;

  return statuses.find((candidate) => candidate.value === status.value || candidate.id === status.id) ?? null;
}

function findTaskKanbanPosition(
  kanbanState: KanbanState,
  taskId: string,
  statusKeys: string[],
  tasks: Task[],
): { status: string; index: number } {
  for (const status of statusKeys) {
    const index = (kanbanState[status] || []).findIndex((id) => compareIds(id, taskId));
    if (index >= 0) return { status, index };
  }

  const task = tasks.find((candidate) => compareIds(candidate.id, taskId));
  const status = taskStatusValue(task, statusKeys);
  const index = (kanbanState[status] || []).length;

  return { status, index };
}

function removeTaskFromKanbanState(kanbanState: KanbanState, taskId: string, statusKeys: string[]): KanbanState {
  return statusKeys.reduce<KanbanState>((acc, status) => {
    acc[status] = (kanbanState[status] || []).filter((id) => !compareIds(id, taskId));
    return acc;
  }, {});
}

function insertTaskIntoKanbanState(
  kanbanState: KanbanState,
  taskId: string,
  status: string,
  destinationIndex: number,
): KanbanState {
  const list = [...(kanbanState[status] || [])];
  const boundedIndex = Math.max(0, Math.min(destinationIndex, list.length));
  list.splice(boundedIndex, 0, taskId);

  return {
    ...kanbanState,
    [status]: list,
  };
}

function taskStatusValue(task: Task | undefined, statusKeys: string[]): string {
  const value = task?.status?.value || task?.status?.id;

  if (value && statusKeys.includes(value)) return value;

  return statusKeys[0] || "pending";
}

function isClosedStatus(status: StatusOption): boolean {
  return status.closed === true;
}

function validateStatusForBackend(statusOption: StatusOption | null): TaskStatus | null {
  if (statusOption?.value === "unknown-status") {
    console.error("Cannot move task to unknown-status");
    showErrorToast("Error", "Cannot move task to unknown status");
    return null;
  }

  const backendStatus = serializeTaskStatus(statusOption);
  if (!backendStatus) {
    console.error("Unknown Kanban status");
    showErrorToast("Error", "Failed to update task status");
    return null;
  }

  return backendStatus;
}

function applyOptimisticTaskStatusUpdate(
  taskId: string,
  statusOption: StatusOption | null,
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>,
) {
  if (!setTasks || !statusOption) return;

  setTasks((prevTasks) =>
    prevTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: {
              ...task.status,
              ...statusOption,
              value: statusOption.value,
            },
          }
        : task,
    ),
  );
}

function serializeKanbanState(state: KanbanState): string {
  const { "unknown-status": _, ...backendState } = state;
  return JSON.stringify(backendState);
}
