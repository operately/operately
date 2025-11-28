import React, { useMemo } from "react";
import { IconFileText, IconMessageCircle } from "../../icons";
import { DateField } from "../../DateField";
import { BlackLink } from "../../Link";
import { createTestId } from "../../TestableElement";
import type { TaskBoard } from "../components";
import type { TaskBoardProps } from "../types";
import { Column } from "./Column";
import type { KanbanStatus } from "./types";
import { StatusSelector } from "../../StatusSelector";

interface MilestoneKanbanProps {
  milestone: TaskBoard.Milestone | null;
  columns: Record<KanbanStatus, TaskBoard.Task[]>;
  draggedItemId: string | null;
  statuses: StatusSelector.StatusOption[];
  onTaskAssigneeChange?: TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoardProps["onTaskDueDateChange"];
  onMilestoneUpdate?: TaskBoardProps["onMilestoneUpdate"];
  assigneePersonSearch?: TaskBoardProps["assigneePersonSearch"];
}

export function MilestoneKanban({
  milestone,
  columns,
  draggedItemId,
  statuses,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onMilestoneUpdate,
  assigneePersonSearch,
}: MilestoneKanbanProps) {
  const testId = useMemo(() => (milestone ? createTestId("milestone", milestone.id) : "kanban-no-milestone"), [milestone]);

  const handleMilestoneDueDateChange = (newDueDate: DateField.ContextualDate | null) => {
    if (milestone && onMilestoneUpdate) {
      onMilestoneUpdate(milestone.id, { name: milestone.name, dueDate: newDueDate || null });
    }
  };

  return (
    <section className="border-t border-surface-outline bg-surface-base first:border-t-0 first:rounded-lg" data-test-id={testId}>
      <header className="flex items-center justify-between gap-3 px-4 pt-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {milestone ? (
            <BlackLink
              to={milestone.link || "#"}
              className="truncate text-sm font-semibold text-content-base hover:text-link-hover transition-colors"
              underline="hover"
              title={milestone.name}
            >
              {milestone.name}
            </BlackLink>
          ) : (
            <span className="text-sm font-semibold text-content-base">No milestone</span>
          )}

          {milestone?.hasDescription && (
            <span className="inline-flex items-center gap-1 text-content-dimmed" data-test-id="description-indicator">
              <IconFileText size={12} />
            </span>
          )}

          {milestone?.hasComments && (
            <span className="inline-flex items-center gap-1 text-content-dimmed" data-test-id="comments-indicator">
              <IconMessageCircle size={12} />
              {milestone.commentCount !== undefined && <span>{milestone.commentCount}</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DateField
            date={milestone?.dueDate || null}
            onDateSelect={handleMilestoneDueDateChange}
            variant="inline"
            showOverdueWarning={true}
            placeholder="Set due date"
            readonly={!milestone || !onMilestoneUpdate}
            size="small"
          />
        </div>
      </header>

      <div className="p-3 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {statuses.map((status, index) => (
            <Column
              key={status.value}
              title={status.label}
              status={status.value}
              containerId={`${milestone?.id ?? "no_milestone"}:${status.value}`}
              tasks={columns[status.value] || []}
              draggedItemId={draggedItemId}
              onTaskAssigneeChange={onTaskAssigneeChange}
              onTaskDueDateChange={onTaskDueDateChange}
              assigneePersonSearch={assigneePersonSearch}
              isFirst={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
