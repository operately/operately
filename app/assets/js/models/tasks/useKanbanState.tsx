import * as React from "react";

import Api, { type TaskStatus } from "@/api";
import { MilestoneKanbanPage, SpaceKanbanPage, showErrorToast } from "turboui";

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

  const handleTaskKanbanChange = React.useCallback(
    async (event: TaskKanbanChangeEvent) => {
      const previousState = kanbanState;
      const statusOption = statuses.find((s) => s.value === event.to.status) ?? null;
      const backendStatus = validateStatusForBackend(statusOption);

      if (!backendStatus) return;

      hasOptimisticUpdateRef.current = true;
      setKanbanState(event.updatedKanbanState);
      applyOptimisticTaskStatusUpdate(event.taskId, statusOption, setTasks);

      try {
        await Api.tasks.updateKanban({
          taskId: event.taskId,
          status: backendStatus,
          kanbanState: serializeKanbanState(event.updatedKanbanState),
          type: type === "milestone" ? "project" : "space",
        });

        if (onSuccess) {
          await onSuccess();
        }
      } catch (e) {
        console.error("Failed to update Kanban state", e);
        showErrorToast("Error", "Failed to update task position");
        setKanbanState(previousState);
      }
    },
    [kanbanState, type, options, onSuccess, setTasks, statuses],
  );

  return { kanbanState, handleTaskKanbanChange };
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
