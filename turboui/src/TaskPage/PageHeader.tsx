import React from "react";
import { TaskPage } from ".";
import { StatusSelector } from "../TaskBoard/components/StatusSelector";
import { TextField } from "../TextField";

export function PageHeader(props: TaskPage.State) {
  return (
    <div className="mt-4">
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <TextField
            className="font-semibold leading-tight text-xl sm:text-2xl md:text-3xl break-words min-w-0"
            text={props.name}
            onChange={props.onNameChange}
            readonly={!props.canEdit}
            trimBeforeSave
          />

          {/* Show status next to title on md+; on mobile it's shown in the mobile sidebar row */}
          <div className="hidden md:block">
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
    </div>
  );
}
