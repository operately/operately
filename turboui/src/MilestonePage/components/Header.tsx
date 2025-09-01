import React from "react";

import { IconFlag } from "../../icons";
import { StatusBadge } from "../../StatusBadge";
import { TextField } from "../../TextField";

interface Props {
  title: string;
  canEdit: boolean;
  status: string;
  onMilestoneTitleChange: (title: string) => void;
}

export function Header({ title, canEdit, status, onMilestoneTitleChange }: Props) {
  return (
    <div
      className="sticky top-0 bg-surface-base z-10 ml-4 my-6 space-y-2 transition-all duration-200"
    >
      {/* Title line: flag icon + milestone name + status badge */}
      <div className="flex items-center gap-2">
        <IconFlag size={20} className="text-blue-500" />
        <TextField
          className="font-semibold text-2xl"
          text={title}
          onChange={onMilestoneTitleChange}
          readonly={!canEdit}
          trimBeforeSave
        />
        <StatusBadge
          status={status === "done" ? "completed" : "in_progress"}
          customLabel={status === "done" ? undefined : "Active"}
          hideIcon={true}
        />
      </div>
    </div>
  );
}
