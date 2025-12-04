import * as React from "react";

import Api, { type ProjectTaskStatus } from "@/api";
import { TaskBoard, showErrorToast, StatusSelector } from "turboui";

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
  statuses: StatusSelector.StatusOption[];
  milestoneId: string;
  tasks: TaskBoard.Task[];
  onSuccess?: () => Promise<void> | void;
}

export function useMilestoneKanbanState({
  initialRawState,
  statuses,
  milestoneId,
  tasks,
  onSuccess,
}: UseMilestoneKanbanStateOptions) {
  const [kanbanState, setKanbanState] = React.useState<MilestoneKanbanState>(() =>
    parseMilestoneKanbanState(initialRawState, statuses, tasks),
  );

  React.useEffect(() => {
    setKanbanState(parseMilestoneKanbanState(initialRawState, statuses, tasks));
  }, [initialRawState, statuses, tasks]);

  const handleTaskKanbanChange = React.useCallback(
    async (event: TaskKanbanChangeEvent) => {
      const previousState = kanbanState;

      const statusOption = statuses.find((s) => s.value === event.to.status) ?? null;
      const backendStatus: ProjectTaskStatus | null = serializeTaskStatus(statusOption);

      if (!backendStatus) {
        console.error("Unknown Kanban status", event.to.status);
        showErrorToast("Error", "Failed to update task status");
        return;
      }

      // Optimistic update
      setKanbanState(event.updatedKanbanState);

      try {
        await Api.project_tasks.updateKanban({
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
    [kanbanState, milestoneId, onSuccess, statuses],
  );

  return { kanbanState, handleTaskKanbanChange };
}

type MilestoneKanbanState = Record<string, string[]>;

function parseMilestoneKanbanState(
  raw: unknown,
  statuses: StatusSelector.StatusOption[],
  tasks?: TaskBoard.Task[],
): MilestoneKanbanState {
  let parsed: any = {};

  if (raw == null) {
    parsed = {};
  } else if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // If parsing fails, fall back to an empty state; errors are logged for debugging.
      // eslint-disable-next-line no-console
      console.error("Failed to parse tasksKanbanState", e);
      parsed = {};
    }
  } else if (typeof raw === "object") {
    parsed = raw;
  }

  const statusKeys = statuses.map((s) => s.value);

  const parsedRecord = parsed as Record<string, unknown>;

  const parsedState: MilestoneKanbanState = statusKeys.reduce<MilestoneKanbanState>((acc, key) => {
    const camelKey = toCamelCaseStatusKey(key);
    const rawList = (parsedRecord as any)[key] ?? (parsedRecord as any)[camelKey];
    const list = Array.isArray(rawList) ? rawList : [];
    acc[key] = list.map((id: unknown) => String(id));
    return acc;
  }, {} as MilestoneKanbanState);

  if (!tasks || tasks.length === 0) {
    return parsedState;
  }

  const presentTaskIds: string[] = [];

  statusKeys.forEach((status) => {
    const ids = parsedState[status] || [];
    ids.forEach((rawId) => {
      const match = tasks.find((task) => compareIds(task.id, rawId));
      if (match && !includesId(presentTaskIds, match.id)) {
        presentTaskIds.push(match.id);
      }
    });
  });

  const fullState: MilestoneKanbanState = {};

  statusKeys.forEach((status) => {
    const orderedTasks = (parsedState[status] || [])
      .map((rawId) => tasks.find((task) => compareIds(task.id, rawId)))
      .filter((task): task is TaskBoard.Task => Boolean(task));

    const orderedIds = orderedTasks.map((task) => task.id);

    const fallbackIds = tasks
      .filter((task) => resolveTaskKanbanStatus(task, statusKeys) === status && !includesId(presentTaskIds, task.id))
      .map((task) => task.id);

    fullState[status] = [...orderedIds, ...fallbackIds];
  });

  return fullState;
}

function toCamelCaseStatusKey(key: string): string {
  return key.replace(/_([a-z])/g, (_match, group: string) => group.toUpperCase());
}

function resolveTaskKanbanStatus(task: TaskBoard.Task, statusKeys: string[]): string {
  const value = (task.status as any)?.value || (task.status as any)?.id;

  if (value && statusKeys.includes(value)) return value;

  return statusKeys[0] || "unassigned";
}

function serializeMilestoneKanbanState(state: MilestoneKanbanState): string {
  return JSON.stringify(state);
}
