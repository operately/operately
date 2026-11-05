import type { TasksMoveInput, TasksMoveResult } from "@/api";
import type { Paths } from "@/routes/paths";

export type TaskMoveDestination = {
  movedTaskId: string;
  destinationType: TasksMoveInput["destinationType"];
  destinationId: string;
};

export function resolveTaskMoveDestination(result: TasksMoveResult, request: TasksMoveInput): TaskMoveDestination {
  return {
    movedTaskId: result.task?.id ?? request.taskId,
    destinationType: result.destinationType ?? request.destinationType,
    destinationId: result.destinationId ?? request.destinationId,
  };
}

export function taskMoveDestinationPath(paths: Paths, destination: TaskMoveDestination): string {
  if (destination.destinationType === "space") {
    return paths.spaceKanbanPath(destination.destinationId, { taskId: destination.movedTaskId });
  }

  return paths.taskPath(destination.movedTaskId);
}
