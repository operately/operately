import React from "react";
import type { Task, TaskBoardSummary } from "../ApiTypes";
import { AvatarList } from "../Avatar";
import { DivLink } from "../Link";
import { IconCircleCheckCustom, IconCircleDashed, IconCircleDot, IconCircleXCustom } from "../icons";
import { StatusSelector } from "../StatusSelector";
import { ZeroState } from "./ZeroState";

export function SpaceTaskBoardCard({ board, tasks, to }: { board: TaskBoardSummary; tasks: Task[]; to: string }) {
  return (
    <DivLink
      to={to}
      testId={board.isDefault ? "tasks-tool" : `tasks-tool-${board.id}`}
      className="text-xs w-full h-[380px] max-w-[340px] overflow-hidden border border-stroke-base bg-surface-base rounded-lg shadow-sm transition-shadow duration-300 hover:shadow hover:border-surface-outline group"
    >
      {tasks.length === 0 ? (
        <ZeroState name={board.name} />
      ) : (
        <div className="flex flex-col h-full">
          <div className="font-bold text-base text-center py-2 truncate px-3">{board.name}</div>
          <div className="bg-surface-dimmed rounded mx-2 flex-1">
            {tasks.slice(0, 7).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-2 py-2 px-2 border-b border-stroke-base last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TaskStatus task={task} />
                  <span className="font-bold truncate">{task.name}</span>
                </div>
                <AvatarList people={task.assignees ?? []} size={26} maxElements={3} />
              </div>
            ))}
          </div>
        </div>
      )}
    </DivLink>
  );
}

function TaskStatus({ task }: { task: Task }) {
  if (!task.status) return null;
  const color = task.status.color ?? "gray";
  const Icon =
    color === "green"
      ? IconCircleCheckCustom
      : color === "red"
        ? IconCircleXCustom
        : color === "blue"
          ? IconCircleDot
          : IconCircleDashed;
  const colorClass =
    StatusSelector.STATUS_COLOR_MAP[color]?.iconClass ?? StatusSelector.STATUS_COLOR_MAP.gray.iconClass;
  return (
    <span title={task.status.label} className={`shrink-0 ${colorClass}`}>
      <Icon size={16} />
    </span>
  );
}
