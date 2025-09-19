import React from "react";
import { TaskPage } from ".";
import { StatusSelector } from "../TaskBoard/components/StatusSelector";
import { TextField } from "../TextField";
import classNames from "../utils/classnames";

export function PageHeader(props: TaskPage.State) {
  const canToggleToDone = props.canEdit && props.status !== "done";

  const handleQuickComplete = () => {
    if (!canToggleToDone) return;
    props.onStatusChange("done");
  };

  return (
    <div className="mt-4">
      <div className="flex-1">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="flex items-start md:items-center gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={props.status === "done"}
              aria-label="Mark task as done"
              aria-disabled={!canToggleToDone}
              disabled={!canToggleToDone}
              onClick={handleQuickComplete}
              className={classNames(
                "relative flex-shrink-0 border-2 rounded-md flex items-center justify-center transition-colors",
                "w-6 h-6 md:w-8 md:h-8",
                canToggleToDone
                  ? "border-surface-outline bg-surface-base hover:border-callout-success-content hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-primary-base"
                  : "border-surface-outline/60 bg-surface-base/80 cursor-not-allowed opacity-60",
              )}
              data-test-id="task-quick-complete"
            >
              {props.status === "done" && <span className="text-callout-success-content text-xl leading-none">✔️</span>}
            </button>

            <TextField
              className="inline align-baseline font-semibold leading-tight text-xl sm:text-2xl md:text-3xl break-words min-w-0"
              text={props.name}
              onChange={props.onNameChange}
              readonly={!props.canEdit}
              trimBeforeSave
              testId="task-name"
            />
          </div>

          {/* On md+, place status inline right after the title */}
          <span className="hidden md:inline align-baseline">
            <StatusSelector
              status={props.status}
              onChange={props.onStatusChange}
              size="md"
              readonly={!props.canEdit}
              showFullBadge={true}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
