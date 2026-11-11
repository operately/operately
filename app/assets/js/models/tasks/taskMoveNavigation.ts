import type { TasksMoveInput, TasksMoveResult } from "@/api";
import type { Paths } from "@/routes/paths";

export type TaskMoveDestination = {
  movedTaskId: string;
  destinationType: TasksMoveInput["destinationType"];
  destinationId: string;
  boardId?: string | null;
};

export function resolveTaskMoveDestination(result: TasksMoveResult, request: TasksMoveInput): TaskMoveDestination {
  return {
    movedTaskId: result.task?.id ?? request.taskId,
    destinationType: result.destinationType ?? request.destinationType,
    destinationId: result.destinationId ?? request.destinationId,
    boardId: result.boardId ?? result.task?.boardId ?? null,
  };
}

export function taskMoveDestinationPath(paths: Paths, destination: TaskMoveDestination): string {
  if (destination.destinationType === "space") {
    if (!destination.boardId) return paths.spacePath(destination.destinationId);
    return paths.spaceKanbanPath(destination.destinationId, destination.boardId, { taskId: destination.movedTaskId });
  }

  return paths.taskPath(destination.movedTaskId);
}
