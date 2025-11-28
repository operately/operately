import React from "react";
import { TaskPage } from ".";
import { StatusSelector } from "../StatusSelector";
import { TextField } from "../TextField";
import { TaskCheckbox } from "./TaskCheckbox";
import { findCompletedStatus } from "../TaskBoard/utils/status";

export function PageHeader({statusOptions, ...props}: TaskPage.State) {
  const completedStatus = findCompletedStatus(statusOptions || []);

  return (
    <div className="mt-4">
      <div className="flex-1">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="flex items-start md:items-center gap-3">
            {completedStatus &&
              <TaskCheckbox
                status={props.status}
                canEdit={props.canEdit}
                onComplete={() => props.onStatusChange(completedStatus)}
              />
            }

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
          {statusOptions?.length > 0 && (
            <span className="hidden md:inline align-baseline">
              <StatusSelector
                statusOptions={statusOptions}
                status={props.status ?? statusOptions[0]!}
                onChange={(nextStatus) => props.onStatusChange(nextStatus)}
                size="md"
                readonly={!props.canEdit}
                showFullBadge={true}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
