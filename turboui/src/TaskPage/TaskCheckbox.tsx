import React from "react";
import classNames from "../utils/classnames";
import { IconCheck } from "../icons";
import { Status } from "../TaskBoard/types";

interface TaskCheckboxProps {
  status: Status;
  canEdit: boolean;
  onComplete: () => void;
}

export function TaskCheckbox({ status, canEdit, onComplete }: TaskCheckboxProps) {
  const isDone = status === "done";
  const canToggleToDone = canEdit && !isDone;

  const handleClick = () => {
    if (!canToggleToDone) return;
    onComplete();
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isDone}
      aria-label="Mark task as done"
      aria-disabled={!canToggleToDone}
      disabled={!canToggleToDone}
      onClick={handleClick}
      className={classNames(
        "relative flex-shrink-0 rounded-md flex items-center justify-center transition-colors border-2",
        "w-8 h-8 md:w-10 md:h-10",
        isDone
          ? "border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400 text-white shadow-sm cursor-default"
          : canToggleToDone
            ? "border-surface-outline bg-surface-base hover:border-callout-success-content hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base cursor-pointer"
            : "border-surface-outline/60 bg-surface-base/80 cursor-not-allowed opacity-60",
      )}
      data-test-id="task-quick-complete"
    >
      {isDone && <IconCheck size={32} stroke={3} className="text-stone-50" />}
    </button>
  );
}
