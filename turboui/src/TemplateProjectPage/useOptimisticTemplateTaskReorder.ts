import React from "react";
import type { BoardMove } from "../utils/PragmaticDragAndDrop";
import type { TemplateProjectPage } from "./index";

export const ROOT_TASKS_CONTAINER_ID = "no-milestone";

interface PendingTaskMove {
  id: number;
  optimisticLayout: string;
}

export function useOptimisticTemplateTaskReorder({
  tasks: confirmedTasksFromProps,
  statuses,
  onTaskReorder,
  enabled,
}: {
  tasks: TemplateProjectPage.Task[];
  statuses: TemplateProjectPage.Props["statuses"];
  onTaskReorder?: TemplateProjectPage.Props["onTaskReorder"];
  enabled: boolean;
}) {
  const [tasks, setTasks] = React.useState(confirmedTasksFromProps);
  const confirmedTasks = React.useRef(confirmedTasksFromProps);
  const confirmedLayout = React.useRef(taskLayoutKey(confirmedTasksFromProps));
  const pendingMove = React.useRef<PendingTaskMove | null>(null);
  const nextMoveId = React.useRef(0);
  const isDraggingEnabled = enabled && Boolean(onTaskReorder);

  React.useLayoutEffect(() => {
    const incomingLayout = taskLayoutKey(confirmedTasksFromProps);

    confirmedTasks.current = confirmedTasksFromProps;
    confirmedLayout.current = incomingLayout;

    const pending = pendingMove.current;
    if (!pending || incomingLayout === pending.optimisticLayout) {
      setTasks(confirmedTasksFromProps);
    }
  }, [confirmedTasksFromProps]);

  const handleTaskMove = React.useCallback(
    async (move: BoardMove) => {
      if (!isDraggingEnabled || !onTaskReorder) return;

      const milestoneId =
        move.destination.containerId === ROOT_TASKS_CONTAINER_ID ? null : move.destination.containerId;
      const moveId = ++nextMoveId.current;
      const previousLayout = taskLayoutKey(tasks);
      const optimisticTasks = moveTask(tasks, move.itemId, milestoneId, move.destination.index, statuses);

      pendingMove.current = {
        id: moveId,
        optimisticLayout: taskLayoutKey(optimisticTasks),
      };
      setTasks(optimisticTasks);

      let successful = false;
      try {
        successful = (await onTaskReorder(move.itemId, milestoneId, move.destination.index)) !== false;
      } catch (_error) {
        successful = false;
      }

      if (pendingMove.current?.id !== moveId) return;
      pendingMove.current = null;

      if (!successful) {
        setTasks(confirmedTasks.current);
      } else if (confirmedLayout.current !== previousLayout) {
        setTasks(confirmedTasks.current);
      }
    },
    [isDraggingEnabled, onTaskReorder, statuses, tasks],
  );

  return { tasks, handleTaskMove, isDraggingEnabled };
}

function taskLayoutKey(tasks: TemplateProjectPage.Task[]) {
  const taskIdsByContainer = new Map<string, string[]>();

  for (const task of tasks) {
    const containerId = task.milestoneId ?? ROOT_TASKS_CONTAINER_ID;
    const taskIds = taskIdsByContainer.get(containerId) ?? [];
    taskIdsByContainer.set(containerId, [...taskIds, task.id]);
  }

  return [...taskIdsByContainer.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([containerId, taskIds]) => `${containerId}:${taskIds.join(",")}`)
    .join("|");
}

function moveTask(
  tasks: TemplateProjectPage.Task[],
  taskId: string,
  milestoneId: string | null,
  destinationIndex: number,
  statuses: TemplateProjectPage.Props["statuses"],
) {
  const task = tasks.find((candidate) => candidate.id === taskId);
  if (!task) return tasks;

  const remainingTasks = tasks.filter((candidate) => candidate.id !== taskId);
  const destinationTasks = remainingTasks.filter((candidate) => candidate.milestoneId === milestoneId);
  const boundedIndex = Math.max(0, Math.min(destinationIndex, destinationTasks.length));
  const movedTask = { ...task, milestoneId };
  const nextDestinationTask = destinationTasks[boundedIndex];

  if (nextDestinationTask) {
    const insertionIndex = remainingTasks.findIndex((candidate) => candidate.id === nextDestinationTask.id);
    remainingTasks.splice(insertionIndex, 0, movedTask);
  } else {
    const lastDestinationTask = destinationTasks[destinationTasks.length - 1];
    const insertionIndex = lastDestinationTask
      ? remainingTasks.findIndex((candidate) => candidate.id === lastDestinationTask.id) + 1
      : remainingTasks.length;
    remainingTasks.splice(insertionIndex, 0, movedTask);
  }

  return milestoneId === null ? normalizeRootTaskOrder(remainingTasks, statuses) : remainingTasks;
}

function normalizeRootTaskOrder(tasks: TemplateProjectPage.Task[], statuses: TemplateProjectPage.Props["statuses"]) {
  const statusPositions = new Map(statuses.map((status, index) => [status.value || status.id, index]));
  const rootTasks = tasks
    .filter((task) => task.milestoneId === null)
    .sort(
      (left, right) =>
        (statusPositions.get(left.status.value || left.status.id) ?? Number.MAX_SAFE_INTEGER) -
        (statusPositions.get(right.status.value || right.status.id) ?? Number.MAX_SAFE_INTEGER),
    );
  let rootIndex = 0;

  return tasks.map((task) => (task.milestoneId === null ? rootTasks[rootIndex++]! : task));
}
