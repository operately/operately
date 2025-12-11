import * as React from "react";

import Api, { type TaskStatus } from "@/api";
import { MilestoneKanbanPage, showErrorToast } from "turboui";

import { serializeTaskStatus } from "./index";
import { parseKanbanState, type KanbanState } from "./parseKanbanState";

interface TaskKanbanChangeEvent {
  milestoneId: string | null;
  taskId: string;
  from: { status: string; index: number };
  to: { status: string; index: number };
  updatedKanbanState: KanbanState;
}

interface UseMilestoneKanbanStateOptions {
  initialRawState: unknown;
  statuses: MilestoneKanbanPage.StatusOption[];
  milestoneId: string;
  tasks: MilestoneKanbanPage.Task[];
  setTasks?: React.Dispatch<React.SetStateAction<MilestoneKanbanPage.Task[]>>;
  onSuccess?: () => Promise<void> | void;
}

export function useMilestoneKanbanState({
  initialRawState,
  statuses,
  milestoneId,
  tasks,
  setTasks,
  onSuccess,
}: UseMilestoneKanbanStateOptions) {
  const [kanbanState, setKanbanState] = React.useState<KanbanState>(() =>
    parseKanbanState(initialRawState, statuses, tasks),
  );
  
  // Prevents refresh from overwriting optimistic updates before backend confirms them
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
          milestoneId,
          status: backendStatus,
          milestoneKanbanState: serializeKanbanState(event.updatedKanbanState),
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
    [kanbanState, milestoneId, onSuccess, setTasks, statuses],
  );

  return { kanbanState, handleTaskKanbanChange };
}

// 
// Helpers
// 

function validateStatusForBackend(
  statusOption: MilestoneKanbanPage.StatusOption | null,
): TaskStatus | null {
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
  statusOption: MilestoneKanbanPage.StatusOption | null,
  setTasks?: React.Dispatch<React.SetStateAction<MilestoneKanbanPage.Task[]>>,
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
