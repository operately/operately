import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StatusSelector } from "../../StatusSelector";
import { useBoardDnD } from "../../utils/PragmaticDragAndDrop";
import { MilestoneKanban } from "./MilestoneKanban";
import type { KanbanBoardProps, KanbanStatus, MilestoneKanbanState } from "./types";
import type { TaskBoard } from "../components";

const NO_MILESTONE_ID = "no_milestone";

export function KanbanBoard({
  milestones,
  tasks,
  statuses,
  kanbanStateByMilestone,
  onTaskKanbanChange,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onMilestoneUpdate,
  assigneePersonSearch,
}: KanbanBoardProps) {
  const statusKeys = useMemo(() => statuses.map((status) => status.value), [statuses]);
  const [internalTasks, setInternalTasks] = useState<TaskBoard.Task[]>(tasks);
  const [kanbanState, setKanbanState] = useState<Record<string, MilestoneKanbanState>>(
    normalizeKanbanState(kanbanStateByMilestone, milestones, statusKeys),
  );
  const [noMilestoneState, setNoMilestoneState] = useState<MilestoneKanbanState>(deriveNoMilestoneState(tasks, statusKeys));

  useEffect(() => setInternalTasks(tasks), [tasks]);
  useEffect(() => {
    setKanbanState(normalizeKanbanState(kanbanStateByMilestone, milestones, statusKeys));
  }, [kanbanStateByMilestone, milestones, statusKeys]);
  useEffect(() => setNoMilestoneState(deriveNoMilestoneState(tasks, statusKeys)), [tasks, statusKeys]);

  const taskById = useMemo(() => {
    const map = new Map<string, TaskBoard.Task>();
    internalTasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [internalTasks]);

  const { draggedItemId } = useBoardDnD(
    useCallback(
      (move) => {
        const source = parseContainer(move.source.containerId);
        const destination = parseContainer(move.destination.containerId);
        if (!source || !destination) return;

        const nextKanbanState = applyKanbanMove(kanbanState, move.itemId, source, destination, move.destination.index, statusKeys);
        const nextNoMilestoneState = applyNoMilestoneMove(
          noMilestoneState,
          move.itemId,
          source,
          destination,
          move.destination.index,
          statusKeys,
        );

        setKanbanState(nextKanbanState);
        setNoMilestoneState(nextNoMilestoneState);
        setInternalTasks((previous) =>
          previous.map((task) =>
            task.id === move.itemId
              ? updateTaskForMove(task, destination.milestoneId, destination.status, milestones, statuses)
              : task,
          ),
        );

        onTaskKanbanChange?.({
          taskId: move.itemId,
          from: { milestoneId: source.milestoneId, status: source.status, index: move.source.index },
          to: { milestoneId: destination.milestoneId, status: destination.status, index: move.destination.index },
          updatedKanbanStateByMilestone: nextKanbanState,
        });
      },
      [kanbanState, milestones, noMilestoneState, onTaskKanbanChange, statusKeys, statuses],
    ),
  );

  const milestoneOrder = useMemo(() => milestones || [], [milestones]);
  const hasNoMilestoneLane = internalTasks.some((task) => !task.milestone);

  return (
    <div className="space-y-4" data-test-id="kanban-board">
      {milestoneOrder.map((milestone) => (
        <MilestoneKanban
          key={milestone.id}
          milestone={milestone}
          columns={buildColumnsForMilestone(milestone.id, kanbanState, internalTasks, taskById, statusKeys)}
          draggedItemId={draggedItemId}
          statuses={statuses}
          onTaskAssigneeChange={onTaskAssigneeChange}
          onTaskDueDateChange={onTaskDueDateChange}
          onMilestoneUpdate={onMilestoneUpdate}
          assigneePersonSearch={assigneePersonSearch}
        />
      ))}

      {hasNoMilestoneLane && (
        <MilestoneKanban
          milestone={null}
          columns={buildColumnsForNoMilestone(noMilestoneState, internalTasks, taskById, statusKeys)}
          draggedItemId={draggedItemId}
          statuses={statuses}
          onTaskAssigneeChange={onTaskAssigneeChange}
          onTaskDueDateChange={onTaskDueDateChange}
          assigneePersonSearch={assigneePersonSearch}
        />
      )}
    </div>
  );
}

function normalizeKanbanState(
  state: Record<string, MilestoneKanbanState>,
  milestones: TaskBoard.Milestone[],
  statusKeys: KanbanStatus[],
): Record<string, MilestoneKanbanState> {
  const result: Record<string, MilestoneKanbanState> = {};

  milestones?.forEach((milestone) => {
    result[milestone.id] = cloneState(state?.[milestone.id], statusKeys);
  });

  Object.entries(state || {}).forEach(([milestoneId, value]) => {
    result[milestoneId] = cloneState(value, statusKeys);
  });

  return result;
}

function deriveNoMilestoneState(tasks: TaskBoard.Task[], statusKeys: KanbanStatus[]): MilestoneKanbanState {
  const state = cloneState(undefined, statusKeys);

  tasks.forEach((task) => {
    if (task.milestone) return;

    const status = statusFromTask(task, statusKeys);
    state[status]?.push(task.id);
  });

  return state;
}

function statusFromTask(task: TaskBoard.Task, statusKeys: KanbanStatus[]): KanbanStatus {
  const value = task.status?.value || task.status?.id;

  if (value && statusKeys.includes(value)) return value;

  // Fallback to first known status or a generic bucket
  return statusKeys[0] || "unassigned";
}

function cloneState(state: MilestoneKanbanState | undefined, statusKeys: KanbanStatus[]): MilestoneKanbanState {
  return statusKeys.reduce<MilestoneKanbanState>((acc, key) => {
    acc[key] = [...(state?.[key] || [])];
    return acc;
  }, {});
}

function parseContainer(containerId: string): { milestoneId: string | null; status: KanbanStatus } | null {
  const [milestoneId, status] = containerId.split(":");

  if (!milestoneId || !status) {
    return null;
  }

  return {
    milestoneId: milestoneId === NO_MILESTONE_ID ? null : milestoneId,
    status,
  };
}

function applyKanbanMove(
  current: Record<string, MilestoneKanbanState>,
  taskId: string,
  source: { milestoneId: string | null; status: KanbanStatus },
  destination: { milestoneId: string | null; status: KanbanStatus },
  destinationIndex: number,
  statusKeys: KanbanStatus[],
): Record<string, MilestoneKanbanState> {
  let next = normalizeKanbanState(current, [], statusKeys);

  if (source.milestoneId) {
    next[source.milestoneId] = removeFromState(
      next[source.milestoneId] || cloneState(undefined, statusKeys),
      taskId,
      source.status,
    );
  }

  if (destination.milestoneId) {
    const base = next[destination.milestoneId] || cloneState(undefined, statusKeys);
    const withoutTask = removeFromAllColumns(base, taskId);
    const updated = insertIntoColumn(withoutTask, taskId, destination.status, destinationIndex);
    next[destination.milestoneId] = updated;
  }

  return next;
}

function applyNoMilestoneMove(
  state: MilestoneKanbanState,
  taskId: string,
  source: { milestoneId: string | null; status: KanbanStatus },
  destination: { milestoneId: string | null; status: KanbanStatus },
  destinationIndex: number,
  statusKeys: KanbanStatus[],
): MilestoneKanbanState {
  let next = cloneState(state, statusKeys);

  if (!source.milestoneId) {
    next = removeFromState(next, taskId, source.status);
  }

  if (!destination.milestoneId) {
    next = insertIntoColumn(next, taskId, destination.status, destinationIndex);
  }

  return next;
}

function removeFromState(state: MilestoneKanbanState, taskId: string, status: KanbanStatus): MilestoneKanbanState {
  const updatedList = (state[status] || []).filter((id) => id !== taskId);
  return {
    ...state,
    [status]: updatedList,
  };
}

function removeFromAllColumns(state: MilestoneKanbanState, taskId: string): MilestoneKanbanState {
  const next: MilestoneKanbanState = {};

  Object.keys(state).forEach((key) => {
    next[key] = state[key]?.filter((id) => id !== taskId) || [];
  });

  return next;
}

function insertIntoColumn(
  state: MilestoneKanbanState,
  taskId: string,
  status: KanbanStatus,
  destinationIndex: number,
): MilestoneKanbanState {
  const list = [...(state[status] || [])];
  const boundedIndex = Math.max(0, Math.min(destinationIndex, list.length));
  list.splice(boundedIndex, 0, taskId);

  return {
    ...state,
    [status]: list,
  };
}

function buildColumnsForMilestone(
  milestoneId: string,
  kanbanState: Record<string, MilestoneKanbanState>,
  tasks: TaskBoard.Task[],
  taskById: Map<string, TaskBoard.Task>,
  statusKeys: KanbanStatus[],
): Record<KanbanStatus, TaskBoard.Task[]> {
  const state = kanbanState[milestoneId] || cloneState(undefined, statusKeys);
  const tasksForMilestone = tasks.filter((task) => task.milestone?.id === milestoneId && !task._isHelperTask);

  return buildColumnsFromState(state, tasksForMilestone, taskById, statusKeys);
}

function buildColumnsForNoMilestone(
  state: MilestoneKanbanState,
  tasks: TaskBoard.Task[],
  taskById: Map<string, TaskBoard.Task>,
  statusKeys: KanbanStatus[],
): Record<KanbanStatus, TaskBoard.Task[]> {
  const tasksWithoutMilestone = tasks.filter((task) => !task.milestone && !task._isHelperTask);
  return buildColumnsFromState(state, tasksWithoutMilestone, taskById, statusKeys);
}

function buildColumnsFromState(
  state: MilestoneKanbanState,
  tasks: TaskBoard.Task[],
  taskById: Map<string, TaskBoard.Task>,
  statusKeys: KanbanStatus[],
): Record<KanbanStatus, TaskBoard.Task[]> {
  const presentTaskIds = new Set<string>();
  statusKeys.forEach((key) => {
    (state[key] || []).forEach((id) => presentTaskIds.add(id));
  });

  const result: Record<KanbanStatus, TaskBoard.Task[]> = {};

  statusKeys.forEach((status) => {
    const orderedTasks = (state[status] || []).map((id) => taskById.get(id)).filter(Boolean) as TaskBoard.Task[];

    const fallbackTasks = tasks.filter(
      (task) => statusFromTask(task, statusKeys) === status && !presentTaskIds.has(task.id),
    );

    result[status] = [...orderedTasks, ...fallbackTasks];
  });

  return result;
}

function updateTaskForMove(
  task: TaskBoard.Task,
  milestoneId: string | null,
  status: KanbanStatus,
  milestones: TaskBoard.Milestone[],
  statuses: StatusSelector.StatusOption[],
): TaskBoard.Task {
  const milestone = milestoneId ? milestones.find((m) => m.id === milestoneId) || null : null;
  const statusMeta = statuses.find((option) => option.value === status) || {
    id: status,
    value: status,
    label: status,
    color: "gray" as StatusSelector.StatusColorName,
    icon: "circleDot" as StatusSelector.StatusIconName,
    index: statuses.length,
  };

  const nextStatus: StatusSelector.StatusOption =
    task.status && (task.status.value === status || task.status.id === status)
      ? task.status
      : {
          ...statusMeta,
          ...task.status,
          id: task.status?.id ?? statusMeta.id,
          value: status,
          label: task.status?.label ?? statusMeta.label,
          color: task.status?.color ?? statusMeta.color,
          icon: (task.status?.icon as StatusSelector.StatusIconName | undefined) ?? statusMeta.icon,
          closed: typeof task.status?.closed === "boolean" ? task.status.closed : statusMeta.closed,
          index: typeof task.status?.index === "number" ? task.status.index : statusMeta.index,
        };

  return {
    ...task,
    milestone,
    status: nextStatus,
  };
}
