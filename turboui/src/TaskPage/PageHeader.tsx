import React from "react";
import { TaskPage } from ".";
import { StatusSelector } from "../TaskBoard/components/StatusSelector";
import { TextField } from "../TextField";

export function PageHeader(props: TaskPage.State) {
  return (
    <div className="mt-4">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <TextField
            className="font-semibold text-2xl"
            text={props.name}
            onChange={props.onNameChange}
            readonly={!props.canEdit}
            trimBeforeSave
          />

          <StatusSelector
            status={props.status}
            onChange={props.onStatusChange}
            size="md"
            readonly={!props.canEdit}
            showFullBadge={true}
          />
        </div>
      </div>
    </div>
  );
}
