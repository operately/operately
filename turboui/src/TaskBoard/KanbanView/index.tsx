import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StatusSelector } from "../../StatusSelector";
import { useBoardDnD, useSortableList } from "../../utils/PragmaticDragAndDrop";
import { Kanban } from "./Kanban";
import { TaskSlideIn } from "./TaskSlideIn";
import { AddStatusModal } from "./AddStatusModal";
import { DeleteStatusModal } from "./DeleteStatusModal";
import type { KanbanBoardProps, KanbanStatus, KanbanState, TaskSlideInContext } from "./types";
import type { TaskBoard } from "../components";
import { useTaskSlideInSelection } from "../hooks/useTaskSlideInSelection";

export function KanbanBoard(props: KanbanBoardProps) {
  const [archived, setArchived] = useState(false);
  const { statuses, kanbanState: kanbanStateProp, onStatusesChange, onTaskKanbanChange, milestone } = props;
  const [orderedStatuses, setOrderedStatuses] = useState<StatusSelector.StatusOption[]>(() => sortStatuses(statuses));

  useEffect(() => {
    setOrderedStatuses(sortStatuses(statuses));
  }, [statuses]);

  const statusKeys = useMemo(() => orderedStatuses.map((status) => status.value), [orderedStatuses]);
  const [kanbanState, setKanbanState] = useState<KanbanState>(normalizeKanbanState(kanbanStateProp, statusKeys));

  useEffect(() => setKanbanState(normalizeKanbanState(kanbanStateProp, statusKeys)), [kanbanStateProp, statusKeys]);

  const [isAddStatusModalOpen, setIsAddStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusSelector.StatusOption | undefined>();
  const [deletingStatus, setDeletingStatus] = useState<StatusSelector.StatusOption | undefined>();

  const { selectedTaskId, setSelectedTaskId, taskPageProps, taskById } = useTaskSlideIn(props);
  const selectedTask = selectedTaskId ? taskById.get(selectedTaskId) : undefined;
  const canChangeArchive = Boolean(props.canEdit && taskPageProps?.canEdit && props.onTaskArchiveChange);

  const changeArchive = async (archived: boolean) => {
    if (!selectedTask || !canChangeArchive) return;
    const saved = await props.onTaskArchiveChange?.(selectedTask.id, archived);
    if (saved) setSelectedTaskId(null);
  };

  const canReorderStatuses = Boolean(props.canEdit && !archived && props.onStatusesChange);

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
          onStatusesChange?.({
            nextStatuses: reindexed as StatusSelector.StatusOption[],
            deletedStatusReplacements: {},
          });

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

        // Drop indexes refer to visible cards; preserve the positions of archived or filtered-out tasks.
        const destinationIds = (kanbanState[destinationStatus] ?? []).filter((id) => id !== move.itemId);
        const visibleIds = destinationIds.filter((id) => {
          const task = taskById.get(id);
          return task && !task.archivedAt;
        });
        const nextVisibleId = visibleIds[move.destination.index];
        const destinationIndex = nextVisibleId ? destinationIds.indexOf(nextVisibleId) : destinationIds.length;

        const nextKanbanState = applyKanbanMove(
          kanbanState,
          move.itemId,
          destinationStatus,
          destinationIndex,
          statusKeys,
        );

        setKanbanState(nextKanbanState);

        onTaskKanbanChange?.({
          milestoneId: milestone?.id ?? null,
          taskId: move.itemId,
          from: { status: sourceStatus, index: move.source.index },
          to: { status: destinationStatus, index: destinationIndex },
          updatedKanbanState: nextKanbanState,
        });
      },
      [kanbanState, milestone?.id, onTaskKanbanChange, statusKeys, taskById],
    ),
    { enabled: props.canEdit && !archived },
  );

  const allColumns = buildColumns(kanbanState, props.tasks, taskById, statusKeys);
  const columns = Object.fromEntries(
    Object.entries(allColumns).map(([status, tasks]) => [
      status,
      tasks.filter((task) => Boolean(task.archivedAt) === archived),
    ]),
  );
  const visibleStatuses = archived
    ? orderedStatuses.filter((status) => (columns[status.value]?.length ?? 0) > 0)
    : orderedStatuses;

  const containerClassName = props.unstyled
    ? "flex flex-col flex-1 overflow-hidden"
    : "flex flex-col flex-1 bg-surface-base border border-surface-outline rounded-md overflow-hidden";

  return (
    <div className={containerClassName} data-test-id="kanban-board">
      <Kanban
        milestone={milestone || null}
        columns={columns}
        draggedItemId={draggedItemId}
        targetLocation={destination}
        placeholderHeight={draggedItemDimensions?.height ?? null}
        statuses={visibleStatuses}
        archiveView={{ archived, onChange: setArchived }}
        onTaskAssigneeChange={props.onTaskAssigneeChange}
        onTaskDueDateChange={props.onTaskDueDateChange}
        onTaskDueOffsetDaysChange={props.onTaskDueOffsetDaysChange}
        assigneePersonSearch={props.assigneePersonSearch}
        onTaskCreate={props.onTaskCreate}
        canEdit={props.canEdit && !archived}
        canManageStatuses={canReorderStatuses}
        onAddStatusClick={
          canReorderStatuses
            ? () => {
                setEditingStatus(undefined);
                setIsAddStatusModalOpen(true);
              }
            : undefined
        }
        onEditStatus={
          canReorderStatuses
            ? (status) => {
                setEditingStatus(status);
                setIsAddStatusModalOpen(true);
              }
            : undefined
        }
        onDeleteStatus={
          canReorderStatuses
            ? (status) => {
                setDeletingStatus(status);
              }
            : undefined
        }
        onTaskClick={setSelectedTaskId}
        isTaskSlideInOpen={Boolean(selectedTaskId)}
        renderHeader={props.renderHeader}
        toolbarLeading={props.toolbarLeading}
        toolbarActions={props.toolbarActions}
      />

      <TaskSlideIn
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        taskPageProps={
          taskPageProps
            ? {
                ...taskPageProps,
                canEdit: taskPageProps.canEdit && !selectedTask?.archivedAt,
                onArchive:
                  canChangeArchive && !selectedTask?.archivedAt && selectedTask?.status?.closed
                    ? () => changeArchive(true)
                    : undefined,
                onRestore: canChangeArchive && selectedTask?.archivedAt ? () => changeArchive(false) : undefined,
              }
            : null
        }
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
          onStatusCreated={(status) =>
            onStatusesChange({
              nextStatuses: sortStatuses([...orderedStatuses, status]),
              deletedStatusReplacements: {},
            })
          }
          onStatusUpdated={(updatedStatus) => {
            const nextStatuses = orderedStatuses.map((s) => (s.id === updatedStatus.id ? updatedStatus : s));
            onStatusesChange({
              nextStatuses: sortStatuses(nextStatuses),
              deletedStatusReplacements: {},
            });
          }}
        />
      )}

      {onStatusesChange && deletingStatus && (
        <DeleteStatusModal
          isOpen={Boolean(deletingStatus)}
          onClose={() => setDeletingStatus(undefined)}
          status={deletingStatus}
          isLastStatus={orderedStatuses.filter((s) => s.value !== "unknown-status").length <= 1}
          statuses={orderedStatuses}
          onConfirm={(replacementStatusId) => {
            const nextStatuses = orderedStatuses.filter((s) => s.id !== deletingStatus.id);
            onStatusesChange({
              nextStatuses: sortStatuses(nextStatuses),
              deletedStatusReplacements: {
                [deletingStatus.id]: replacementStatusId,
              },
            });
            setDeletingStatus(undefined);
          }}
        />
      )}
    </div>
  );
}

function normalizeKanbanState(state: KanbanState | undefined, statusKeys: KanbanStatus[]): KanbanState {
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

function useTaskSlideIn({
  milestone,
  tasks,
  statuses,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskRemindersChange,
  onTaskStatusChange,
  onTaskMilestoneChange,
  onTaskCreate,
  onTaskDelete,
  onTaskNameChange,
  onTaskDescriptionChange,
  milestones,
  onMilestoneSearch,
  assigneePersonSearch,
  richTextHandlers,
  onMoveTask,
  projectSearch,
  spaceSearch,
  getTaskPageProps,
}: KanbanBoardProps) {
  const { selectedTaskId, setSelectedTaskId } = useTaskSlideInSelection({
    tasks,
    enabled: Boolean(getTaskPageProps),
  });

  const taskById = useMemo(() => {
    const map = new Map<string, TaskBoard.Task>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  const taskSlideInContext: TaskSlideInContext = useMemo(
    () => ({
      milestone: milestone ?? undefined,
      tasks,
      statuses,
      onTaskAssigneeChange,
      onTaskDueDateChange,
      onTaskRemindersChange,
      onTaskStatusChange,
      onTaskMilestoneChange,
      onTaskCreate,
      onTaskDelete,
      onMoveTask,
      projectSearch,
      spaceSearch,
      onTaskNameChange,
      onTaskDescriptionChange,
      milestones,
      onMilestoneSearch,
      assigneePersonSearch,
      richTextHandlers,
    }),
    [
      milestone,
      tasks,
      statuses,
      onTaskAssigneeChange,
      onTaskDueDateChange,
      onTaskRemindersChange,
      onTaskStatusChange,
      onTaskMilestoneChange,
      onTaskCreate,
      onTaskDelete,
      onMoveTask,
      projectSearch,
      spaceSearch,
      onTaskNameChange,
      onTaskDescriptionChange,
      milestones,
      onMilestoneSearch,
      assigneePersonSearch,
      richTextHandlers,
    ],
  );

  const taskPageProps = selectedTaskId ? getTaskPageProps(selectedTaskId, taskSlideInContext) : null;

  return {
    selectedTaskId,
    setSelectedTaskId,
    taskPageProps,
    taskById,
  };
}
