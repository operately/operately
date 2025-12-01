import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StatusSelector } from "../../StatusSelector";
import { useBoardDnD } from "../../utils/PragmaticDragAndDrop";
import { MilestoneKanban } from "./MilestoneKanban";
import type { KanbanBoardProps, KanbanStatus, MilestoneKanbanState } from "./types";
import type { TaskBoard } from "../components";

export function KanbanBoard({
  milestone,
  tasks,
  statuses,
  kanbanState: kanbanStateProp,
  onTaskKanbanChange,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onMilestoneUpdate,
  assigneePersonSearch,
}: KanbanBoardProps) {
  const statusKeys = useMemo(() => statuses.map((status) => status.value), [statuses]);
  const tasksForMilestone = useMemo(() => filterTasksForMilestone(tasks, milestone), [milestone, tasks]);
  const [internalTasks, setInternalTasks] = useState<TaskBoard.Task[]>(tasksForMilestone);
  const [kanbanState, setKanbanState] = useState<MilestoneKanbanState>(normalizeKanbanState(kanbanStateProp, statusKeys));

  useEffect(() => setInternalTasks(tasksForMilestone), [tasksForMilestone]);
  useEffect(() => setKanbanState(normalizeKanbanState(kanbanStateProp, statusKeys)), [kanbanStateProp, statusKeys]);

  const taskById = useMemo(() => {
    const map = new Map<string, TaskBoard.Task>();
    internalTasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [internalTasks]);

  const { draggedItemId } = useBoardDnD(
    useCallback(
      (move) => {
        const sourceStatus = parseStatus(move.source.containerId, statusKeys);
        const destinationStatus = parseStatus(move.destination.containerId, statusKeys);
        if (!sourceStatus || !destinationStatus) return;

        const nextKanbanState = applyKanbanMove(kanbanState, move.itemId, destinationStatus, move.destination.index, statusKeys);

        setKanbanState(nextKanbanState);
        setInternalTasks((previous) =>
          previous.map((task) => (task.id === move.itemId ? updateTaskForMove(task, destinationStatus, statuses) : task)),
        );

        onTaskKanbanChange?.({
          milestoneId: milestone?.id ?? null,
          taskId: move.itemId,
          from: { status: sourceStatus, index: move.source.index },
          to: { status: destinationStatus, index: move.destination.index },
          updatedKanbanState: nextKanbanState,
        });
      },
      [kanbanState, milestone?.id, onTaskKanbanChange, statusKeys, statuses],
    ),
  );

  return (
    <div className="space-y-4" data-test-id="kanban-board">
      <MilestoneKanban
        milestone={milestone}
        columns={buildColumns(kanbanState, internalTasks, taskById, statusKeys)}
        draggedItemId={draggedItemId}
        statuses={statuses}
        onTaskAssigneeChange={onTaskAssigneeChange}
        onTaskDueDateChange={onTaskDueDateChange}
        onMilestoneUpdate={onMilestoneUpdate}
        assigneePersonSearch={assigneePersonSearch}
      />
    </div>
  );
}

function normalizeKanbanState(state: MilestoneKanbanState | undefined, statusKeys: KanbanStatus[]): MilestoneKanbanState {
  return cloneState(state, statusKeys);
}

function filterTasksForMilestone(tasks: TaskBoard.Task[], milestone: TaskBoard.Milestone | null): TaskBoard.Task[] {
  if (!milestone) return tasks.filter((task) => !task.milestone && !task._isHelperTask);
  return tasks.filter((task) => task.milestone?.id === milestone.id && !task._isHelperTask);
}

function parseStatus(containerId: string, statusKeys: KanbanStatus[]): KanbanStatus | null {
  if (statusKeys.includes(containerId)) return containerId;
  return null;
}

function applyKanbanMove(
  current: MilestoneKanbanState,
  taskId: string,
  destinationStatus: KanbanStatus,
  destinationIndex: number,
  statusKeys: KanbanStatus[],
): MilestoneKanbanState {
  const base = cloneState(current, statusKeys);
  const withoutTask = removeFromAllColumns(base, taskId);
  return insertIntoColumn(withoutTask, taskId, destinationStatus, destinationIndex);
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

function buildColumns(
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

function statusFromTask(task: TaskBoard.Task, statusKeys: KanbanStatus[]): KanbanStatus {
  const value = task.status?.value || task.status?.id;

  if (value && statusKeys.includes(value)) return value;

  return statusKeys[0] || "unassigned";
}

function cloneState(state: MilestoneKanbanState | undefined, statusKeys: KanbanStatus[]): MilestoneKanbanState {
  return statusKeys.reduce<MilestoneKanbanState>((acc, key) => {
    acc[key] = [...(state?.[key] || [])];
    return acc;
  }, {});
}

function updateTaskForMove(
  task: TaskBoard.Task,
  status: KanbanStatus,
  statuses: StatusSelector.StatusOption[],
): TaskBoard.Task {
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
    status: nextStatus,
  };
}
