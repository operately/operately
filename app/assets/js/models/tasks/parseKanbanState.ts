import { MilestoneKanbanPage } from "turboui";

import { compareIds, includesId } from "@/routes/paths";

export type KanbanState = Record<string, string[]>;

export function parseKanbanState(
  raw: unknown,
  statuses: MilestoneKanbanPage.StatusOption[],
  tasks?: MilestoneKanbanPage.Task[],
): KanbanState {
  const statusKeys = statuses.map((s) => s.value);
  const parsedState = parseRawKanbanState(raw, statusKeys);

  if (!tasks || tasks.length === 0) {
    return parsedState;
  }

  return buildKanbanStateFromTasks(parsedState, tasks, statusKeys);
}

function parseRawKanbanState(raw: unknown, statusKeys: string[]): KanbanState {
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

  return statusKeys.reduce<KanbanState>((acc, key) => {
    const camelKey = toCamelCaseStatusKey(key);
    const rawList = (parsedRecord as any)[key] ?? (parsedRecord as any)[camelKey];
    const list = Array.isArray(rawList) ? rawList : [];
    acc[key] = list.map((id: unknown) => String(id));
    return acc;
  }, {} as KanbanState);
}

function buildKanbanStateFromTasks(
  parsedState: KanbanState,
  tasks: MilestoneKanbanPage.Task[],
  statusKeys: string[],
): KanbanState {
  const presentTaskIds = collectPresentTaskIds(parsedState, tasks, statusKeys);
  const fullState: KanbanState = {};

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

function collectPresentTaskIds(parsedState: KanbanState, tasks: MilestoneKanbanPage.Task[], statusKeys: string[]): string[] {
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
