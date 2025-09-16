import React from "react";
import { TaskPage } from ".";
import { StatusSelector } from "../TaskBoard/components/StatusSelector";
import { TextField } from "../TextField";

export function PageHeader(props: TaskPage.State) {
  return (
    <div className="mt-4">
      <div className="flex-1">
        <div className="flex flex-col gap-2 md:block">
          <TextField
            className="inline align-baseline font-semibold leading-tight text-xl sm:text-2xl md:text-3xl break-words min-w-0"
            text={props.name}
            onChange={props.onNameChange}
            readonly={!props.canEdit}
            trimBeforeSave
          />

          {/* On md+, place status inline right after the title */}
          <span className="hidden md:inline align-baseline ml-2">
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
