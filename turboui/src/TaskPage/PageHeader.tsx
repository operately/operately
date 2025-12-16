import React from "react";
import { TaskPage } from ".";
import { StatusSelector } from "../StatusSelector";
import { TextField } from "../TextField";
import { TaskCheckbox } from "./TaskCheckbox";
import { findCompletedStatus } from "../TaskBoard/utils/status";

export function PageHeader({ statusOptions, ...props }: TaskPage.ContentState) {
  const completedStatus = findCompletedStatus(statusOptions || []);

  return (
    <div className="mt-4">
      <div className="flex-1">
        <div className="flex items-start gap-3" data-test-id="task-header">
          {completedStatus && (
            <TaskCheckbox
              status={props.status}
              canEdit={props.canEdit}
              onComplete={() => props.onStatusChange(completedStatus)}
            />
          )}

          <TextField
            className="font-semibold leading-tight text-xl sm:text-2xl md:text-3xl break-words"
            text={props.name}
            onChange={props.onNameChange}
            readonly={!props.canEdit}
            trimBeforeSave
            testId="task-name"
            multiline
          />

          {statusOptions?.length > 0 && (
            <div className="shrink-0 mt-1">
              <StatusSelector
                statusOptions={statusOptions}
                status={props.status ?? statusOptions[0]!}
                onChange={(nextStatus) => props.onStatusChange(nextStatus)}
                size="md"
                readonly={!props.canEdit}
                showFullBadge={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
