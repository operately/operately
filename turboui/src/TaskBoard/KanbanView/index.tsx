import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StatusSelector } from "../../StatusSelector";
import { useBoardDnD, useSortableList } from "../../utils/PragmaticDragAndDrop";
import { Kanban } from "./Kanban";
import { TaskSlideIn } from "./TaskSlideIn";
import { AddStatusModal } from "./AddStatusModal";
import { DeleteStatusModal } from "./DeleteStatusModal";
import type { KanbanBoardProps, KanbanStatus, KanbanState } from "./types";
import type { TaskBoard } from "../components";

export function KanbanBoard({
  milestone,
  tasks,
  statuses,
  kanbanState: kanbanStateProp,
  onTaskKanbanChange,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  assigneePersonSearch,
  onTaskCreate,
  canManageStatuses,
  onStatusesChange,
  unstyled,
  getTaskPageProps,
}: KanbanBoardProps) {
  const [orderedStatuses, setOrderedStatuses] = useState<StatusSelector.StatusOption[]>(() => sortStatuses(statuses));

  useEffect(() => {
    setOrderedStatuses(sortStatuses(statuses));
  }, [statuses]);

  const statusKeys = useMemo(() => orderedStatuses.map((status) => status.value), [orderedStatuses]);
  const [kanbanState, setKanbanState] = useState<KanbanState>(
    normalizeKanbanState(kanbanStateProp, statusKeys),
  );

  useEffect(() => setKanbanState(normalizeKanbanState(kanbanStateProp, statusKeys)), [kanbanStateProp, statusKeys]);

  const [isAddStatusModalOpen, setIsAddStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusSelector.StatusOption | undefined>();
  const [deletingStatus, setDeletingStatus] = useState<StatusSelector.StatusOption | undefined>();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const taskById = useMemo(() => {
    const map = new Map<string, TaskBoard.Task>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  const taskPageProps = useMemo(() => {
    if (!selectedTaskId) return null;
    return getTaskPageProps?.(selectedTaskId) ?? null;
  }, [getTaskPageProps, selectedTaskId]);

  const canReorderStatuses = Boolean(canManageStatuses && onStatusesChange);

  useSortableList(
    orderedStatuses.map((status, index) => ({ id: status.value, index })),
    useCallback(
      (itemId, newIndex) => {
        if (!canReorderStatuses) return;

        setOrderedStatuses((previous) => {
          const oldIndex = previous.findIndex((status) => status.value === itemId);
          if (oldIndex === -1 || oldIndex === newIndex) return previous;

          const next = [...previous];
          const [moved] = next.splice(oldIndex, 1);
          if (!moved) return previous;

          next.splice(newIndex, 0, moved);

          const reindexed = next.map((status, index) => ({ ...status, index }));
          onStatusesChange?.(reindexed as StatusSelector.StatusOption[]);

          return reindexed;
        });
      },
      [canReorderStatuses, onStatusesChange],
    ),
  );

  const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(
    useCallback(
      (move) => {
        const sourceStatus = parseStatus(move.source.containerId, statusKeys);
        const destinationStatus = parseStatus(move.destination.containerId, statusKeys);
        if (!sourceStatus || !destinationStatus) return;

        // Treat drops onto the synthetic Unknown Status column as cancelled
        if (destinationStatus === "unknown-status") return;

        const nextKanbanState = applyKanbanMove(
          kanbanState,
          move.itemId,
          destinationStatus,
          move.destination.index,
          statusKeys,
        );

        setKanbanState(nextKanbanState);

        onTaskKanbanChange?.({
          milestoneId: milestone?.id ?? null,
          taskId: move.itemId,
          from: { status: sourceStatus, index: move.source.index },
          to: { status: destinationStatus, index: move.destination.index },
          updatedKanbanState: nextKanbanState,
        });
      },
      [kanbanState, milestone?.id, onTaskKanbanChange, statusKeys, orderedStatuses],
    ),
  );

  const containerClassName = unstyled
    ? "flex flex-col flex-1 overflow-hidden"
    : "flex flex-col flex-1 bg-surface-base border border-surface-outline rounded-md overflow-hidden";

  return (
    <div className={containerClassName} data-test-id="kanban-board">
      <Kanban
        milestone={milestone || null}
        columns={buildColumns(kanbanState, tasks, taskById, statusKeys)}
        draggedItemId={draggedItemId}
        targetLocation={destination}
        placeholderHeight={draggedItemDimensions?.height ?? null}
        statuses={orderedStatuses}
        onTaskAssigneeChange={onTaskAssigneeChange}
        onTaskDueDateChange={onTaskDueDateChange}
        assigneePersonSearch={assigneePersonSearch}
        onTaskCreate={onTaskCreate}
        canManageStatuses={canManageStatuses}
        onAddStatusClick={
          canManageStatuses
            ? () => {
                setEditingStatus(undefined);
                setIsAddStatusModalOpen(true);
              }
            : undefined
        }
        onEditStatus={
          canManageStatuses
            ? (status) => {
                setEditingStatus(status);
                setIsAddStatusModalOpen(true);
              }
            : undefined
        }
        onDeleteStatus={
          canManageStatuses
            ? (status) => {
                setDeletingStatus(status);
              }
            : undefined
        }
        onTaskClick={setSelectedTaskId}
      />

      <TaskSlideIn
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        taskPageProps={taskPageProps}
      />

      {onStatusesChange && (
        <AddStatusModal
          isOpen={isAddStatusModalOpen}
          onClose={() => {
            setIsAddStatusModalOpen(false);
            setEditingStatus(undefined);
          }}
          existingStatuses={orderedStatuses}
          statusToEdit={editingStatus}
          onStatusCreated={(status) => onStatusesChange(sortStatuses([...orderedStatuses, status]))}
          onStatusUpdated={(updatedStatus) => {
            const nextStatuses = orderedStatuses.map((s) => (s.id === updatedStatus.id ? updatedStatus : s));
            onStatusesChange(sortStatuses(nextStatuses));
          }}
        />
      )}

      {onStatusesChange && deletingStatus && (
        <DeleteStatusModal
          isOpen={Boolean(deletingStatus)}
          onClose={() => setDeletingStatus(undefined)}
          status={deletingStatus}
          hasTasks={tasks.some((task) => statusFromTask(task, statusKeys) === deletingStatus.value)}
          isLastStatus={orderedStatuses.filter((s) => s.value !== "unknown-status").length <= 1}
          onConfirm={() => {
            const nextStatuses = orderedStatuses.filter((s) => s.id !== deletingStatus.id);
            onStatusesChange(sortStatuses(nextStatuses));
            setDeletingStatus(undefined);
          }}
        />
      )}
    </div>
  );
}

function normalizeKanbanState(
  state: KanbanState | undefined,
  statusKeys: KanbanStatus[],
): KanbanState {
  return cloneState(state, statusKeys);
}

function parseStatus(containerId: string, statusKeys: KanbanStatus[]): KanbanStatus | null {
  if (statusKeys.includes(containerId)) return containerId;
  return null;
}

function applyKanbanMove(
  current: KanbanState,
  taskId: string,
  destinationStatus: KanbanStatus,
  destinationIndex: number,
  statusKeys: KanbanStatus[],
): KanbanState {
  const base = cloneState(current, statusKeys);
  const withoutTask = removeFromAllColumns(base, taskId);
  return insertIntoColumn(withoutTask, taskId, destinationStatus, destinationIndex);
}

function removeFromAllColumns(state: KanbanState, taskId: string): KanbanState {
  const next: KanbanState = {};

  Object.keys(state).forEach((key) => {
    next[key] = state[key]?.filter((id) => id !== taskId) || [];
  });

  return next;
}

function insertIntoColumn(
  state: KanbanState,
  taskId: string,
  status: KanbanStatus,
  destinationIndex: number,
): KanbanState {
  const list = [...(state[status] || [])];
  const boundedIndex = Math.max(0, Math.min(destinationIndex, list.length));
  list.splice(boundedIndex, 0, taskId);

  return {
    ...state,
    [status]: list,
  };
}

function buildColumns(
  state: KanbanState,
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

function cloneState(state: KanbanState | undefined, statusKeys: KanbanStatus[]): KanbanState {
  return statusKeys.reduce<KanbanState>((acc, key) => {
    acc[key] = [...(state?.[key] || [])];
    return acc;
  }, {});
}

function sortStatuses(statuses: StatusSelector.StatusOption[]): StatusSelector.StatusOption[] {
  return [...statuses].sort((a, b) => {
    const aIndex = typeof a.index === "number" ? a.index : 0;
    const bIndex = typeof b.index === "number" ? b.index : 0;

    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.value.localeCompare(b.value);
  });
}
