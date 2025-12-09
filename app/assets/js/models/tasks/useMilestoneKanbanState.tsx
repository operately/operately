import * as React from "react";

import Api, { type ProjectTaskStatus } from "@/api";
import { MilestoneKanbanPage, showErrorToast } from "turboui";

import { compareIds, includesId } from "@/routes/paths";
import { serializeTaskStatus } from "./index";

interface TaskKanbanChangeEvent {
  milestoneId: string | null;
  taskId: string;
  from: { status: string; index: number };
  to: { status: string; index: number };
  updatedKanbanState: MilestoneKanbanState;
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
  const [kanbanState, setKanbanState] = React.useState<MilestoneKanbanState>(() =>
    parseMilestoneKanbanState(initialRawState, statuses, tasks),
  );
  
  // Prevents refresh from overwriting optimistic updates before backend confirms them
  const hasOptimisticUpdateRef = React.useRef(false);

  React.useEffect(() => {
    if (hasOptimisticUpdateRef.current) {
      hasOptimisticUpdateRef.current = false;
      return;
    }
    setKanbanState(parseMilestoneKanbanState(initialRawState, statuses, tasks));
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
          milestoneKanbanState: serializeMilestoneKanbanState(event.updatedKanbanState),
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

type MilestoneKanbanState = Record<string, string[]>;

function validateStatusForBackend(
  statusOption: MilestoneKanbanPage.StatusOption | null,
): ProjectTaskStatus | null {
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

function parseMilestoneKanbanState(
  raw: unknown,
  statuses: MilestoneKanbanPage.StatusOption[],
  tasks?: MilestoneKanbanPage.Task[],
): MilestoneKanbanState {
  const statusKeys = statuses.map((s) => s.value);
  const parsedState = parseRawKanbanState(raw, statusKeys);

  if (!tasks || tasks.length === 0) {
    return parsedState;
  }

  return buildKanbanStateFromTasks(parsedState, tasks, statusKeys);
}

function parseRawKanbanState(raw: unknown, statusKeys: string[]): MilestoneKanbanState {
  let parsed: any = {};

  if (raw == null) {
    parsed = {};
  } else if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse tasksKanbanState", e);
      parsed = {};
    }
  } else if (typeof raw === "object") {
    parsed = raw;
  }

  const parsedRecord = parsed as Record<string, unknown>;

  return statusKeys.reduce<MilestoneKanbanState>((acc, key) => {
    const camelKey = toCamelCaseStatusKey(key);
    const rawList = (parsedRecord as any)[key] ?? (parsedRecord as any)[camelKey];
    const list = Array.isArray(rawList) ? rawList : [];
    acc[key] = list.map((id: unknown) => String(id));
    return acc;
  }, {} as MilestoneKanbanState);
}

function buildKanbanStateFromTasks(
  parsedState: MilestoneKanbanState,
  tasks: MilestoneKanbanPage.Task[],
  statusKeys: string[],
): MilestoneKanbanState {
  const presentTaskIds = collectPresentTaskIds(parsedState, tasks, statusKeys);
  const fullState: MilestoneKanbanState = {};

  statusKeys.forEach((status) => {
    const orderedTasks = (parsedState[status] || [])
      .map((rawId) => tasks.find((task) => compareIds(task.id, rawId)))
      .filter((task): task is MilestoneKanbanPage.Task => Boolean(task))
      .filter((task) => resolveTaskKanbanStatus(task, statusKeys) === status);

    const orderedIds = orderedTasks.map((task) => task.id);

    const fallbackIds = tasks
      .filter((task) => resolveTaskKanbanStatus(task, statusKeys) === status && !includesId(presentTaskIds, task.id))
      .map((task) => task.id);

    fullState[status] = [...orderedIds, ...fallbackIds];
  });

  return fullState;
}

function collectPresentTaskIds(
  parsedState: MilestoneKanbanState,
  tasks: MilestoneKanbanPage.Task[],
  statusKeys: string[],
): string[] {
  const presentTaskIds: string[] = [];

  statusKeys.forEach((status) => {
    const ids = parsedState[status] || [];
    ids.forEach((rawId) => {
      const match = tasks.find((task) => compareIds(task.id, rawId));
      if (match && resolveTaskKanbanStatus(match, statusKeys) === status && !includesId(presentTaskIds, match.id)) {
        presentTaskIds.push(match.id);
      }
    });
  });

  return presentTaskIds;
}

function toCamelCaseStatusKey(key: string): string {
  return key.replace(/_([a-z])/g, (_match, group: string) => group.toUpperCase());
}

function resolveTaskKanbanStatus(task: MilestoneKanbanPage.Task, statusKeys: string[]): string {
  const value = (task.status as any)?.value || (task.status as any)?.id;

  if (value && statusKeys.includes(value)) return value;

  return statusKeys[0] || "unassigned";
}

function serializeMilestoneKanbanState(state: MilestoneKanbanState): string {
  const { "unknown-status": _, ...backendState } = state;
  return JSON.stringify(backendState);
}
