import React from "react";
import { SpaceTaskBoardCard } from "turboui";
import type { Task, TaskBoardSummary } from "@/api";
import { usePaths, compareIds } from "@/routes/paths";

export function Tasks({ spaceId, boards, tasks }: { spaceId: string; boards: TaskBoardSummary[]; tasks: Task[] }) {
  const paths = usePaths();

  return (
    <>
      {boards
        .filter((board) => !board.archivedAt)
        .map((board) => (
          <SpaceTaskBoardCard
            key={board.id}
            board={board}
            to={paths.spaceKanbanPath(spaceId, board.id)}
            tasks={tasks.filter((task) => compareIds(task.boardId, board.id) && !task.archivedAt)}
          />
        ))}
    </>
  );
}
