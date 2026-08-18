import React from "react";

import { IconFlag, IconFlagFilled } from "../../icons";
import { StatusBadge } from "../../StatusBadge";
import { TextField } from "../../TextField";
import type { MilestonePage } from "../types";
import { variantFeatures } from "../variantFeatures";

interface Props {
  variant: MilestonePage.Variant;
  title: string;
  canEdit: boolean;
  status?: MilestonePage.Status;
  onMilestoneTitleChange: (title: string) => void;
}

export function Header({ variant, title, canEdit, status = "pending", onMilestoneTitleChange }: Props) {
  const showStatus = variantFeatures(variant).showStatus;
  const isCompleted = status === "done";

  return (
    <div
      className="sticky top-0 bg-surface-base z-10 ml-0 sm:ml-4 my-6 space-y-2 transition-all duration-200"
      data-test-id="milestone-header"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {showStatus && isCompleted ? (
          <IconFlagFilled size={20} className="text-accent-1" />
        ) : (
          <IconFlag size={20} className={showStatus ? "text-blue-500" : "text-content-subtle"} />
        )}
        <TextField
          className="font-semibold leading-tight text-xl sm:text-2xl break-words min-w-0"
          text={title}
          onChange={onMilestoneTitleChange}
          readonly={!canEdit}
          trimBeforeSave
          testId="milestone-name-input"
        />
        {showStatus && (
          <StatusBadge
            status={isCompleted ? "completed" : "in_progress"}
            customLabel={isCompleted ? undefined : "Active"}
            hideIcon={true}
            className="hidden sm:inline-flex sm:ml-2"
          />
        )}
      </div>
    </div>
  );
}
