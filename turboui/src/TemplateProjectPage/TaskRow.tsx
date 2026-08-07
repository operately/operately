import React from "react";
import { RelativeDayField } from "../RelativeDayField";
import { StatusSelector } from "../StatusSelector";
import { GhostButton } from "../Button";
import type { TemplateProjectPage } from ".";
import { TemplateTaskAssignees } from "./People";

export function TaskRow({
  task,
  props,
  canEdit,
  onClick,
  index,
}: {
  task: TemplateProjectPage.Task;
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <div className="border-b border-surface-outline last:border-b-0" data-test-id={`template-task-${task.id}`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <StatusSelector
          statusOptions={props.statuses}
          status={task.status}
          onChange={(status) => props.onTaskUpdate?.(task.id, { status })}
          readonly={!canEdit}
          size="md"
        />
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-sm font-medium"
          onClick={onClick}
          disabled={!canEdit}
        >
          {task.name}
        </button>
        <TemplateTaskAssignees assignees={task.assignees ?? []} />
        <RelativeDayField
          value={task.dueOffsetDays}
          onChange={(dueOffsetDays) => props.onTaskUpdate?.(task.id, { dueOffsetDays })}
          readonly={!canEdit}
          testId={`template-task-${task.id}-due-offset`}
        />
        {canEdit && props.onTaskReorder && (
          <div className="flex gap-1">
            <GhostButton
              size="xs"
              onClick={() => props.onTaskReorder?.(task.id, task.milestoneId, Math.max(0, index - 1))}
              disabled={index === 0}
            >
              Move up
            </GhostButton>
            <GhostButton size="xs" onClick={() => props.onTaskReorder?.(task.id, task.milestoneId, index + 1)}>
              Move down
            </GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}
