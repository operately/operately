import React, { useState } from "react";
import { PrimaryButton as Button, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { IconFileText, IconFlag, IconFlagFilled, IconGripVertical, IconMessageCircle } from "../icons";
import { Link } from "../Link";
import * as TaskBoardTypes from "../TaskBoard/types";
import classNames from "../utils/classnames";
import { createTestId } from "../TestableElement";
import { useDraggable } from "../utils/DragAndDrop";

interface MilestoneItemProps {
  milestone: TaskBoardTypes.Milestone;
  canEdit: boolean;
  onUpdate?: (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => void;
  isLast?: boolean;
  isDraggable?: boolean;
  itemStyle?: (id: string) => React.CSSProperties;
}

export function MilestoneItem({
  milestone,
  canEdit,
  onUpdate,
  isLast = false,
  isDraggable = false,
  itemStyle,
}: MilestoneItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(milestone.name);
  const [editDueDate, setEditDueDate] = useState<DateField.ContextualDate | null>(milestone.dueDate || null);

  const { ref: draggableRef, isDragging } = useDraggable({
    id: milestone.id,
    zoneId: "milestone-list",
    disabled: !isDraggable,
  });

  const milestoneTestId = createTestId("milestone", milestone.name);
  const editBtnTestId = createTestId("edit-btn", milestone.name);
  const editFormTestId = createTestId("edit-form", milestone.name);
  const nameTestId = createTestId("edit-title", milestone.name);
  const dateTestId = createTestId("edit-due-date", milestone.name);

  const handleSave = () => {
    onUpdate?.(milestone.id, {
      name: editName,
      dueDate: editDueDate,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(milestone.name);
    setEditDueDate(milestone.dueDate || null);
    setIsEditing(false);
  };

  const isCompleted = milestone.status === "done";
  const isDueDateInPast = milestone.dueDate?.date
    ? milestone.dueDate.date < new Date(new Date().setHours(0, 0, 0, 0))
    : false;
  const dueDateColorClass = !isCompleted && isDueDateInPast ? "text-content-error" : "text-content-dimmed";

  if (isEditing) {
    return (
      <div className="flex items-start gap-3" data-test-id={editFormTestId}>
        {/* Timeline flag icon as marker */}
        <div className="flex flex-col items-center mt-1">
          {isCompleted ? (
            <IconFlagFilled size={20} className={classNames("flex-shrink-0", "bg-callout-success-content")} />
          ) : (
            <IconFlag
              size={20}
              className={classNames("flex-shrink-0", milestone.dueDate ? "text-content-dimmed" : "text-content-subtle")}
            />
          )}
          {!isLast && <div className="w-px h-8 bg-stroke-base mt-1" />}
        </div>

        {/* Edit form */}
        <div className="flex-1 min-w-0 pb-6">
          <div className="bg-surface-dimmed rounded-lg p-4 border border-stroke-base">
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-stroke-base rounded-md focus:ring-2 focus:ring-accent-base focus:border-accent-base bg-surface-base"
                autoFocus
                data-test-id={nameTestId}
              />
              <DateField
                date={editDueDate}
                onDateSelect={setEditDueDate}
                placeholder="Due date (optional)"
                testId={dateTestId}
                calendarOnly
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={!editName.trim()}>
                  Save
                </Button>
                <SecondaryButton size="sm" onClick={handleCancel}>
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={draggableRef}
      style={itemStyle?.(milestone.id)}
      className={classNames(
        "relative",
        "flex items-start gap-3 group",
        isDragging && "opacity-50",
        isDraggable && "cursor-grab active:cursor-grabbing",
      )}
      data-test-id={milestoneTestId}
    >
      {isDraggable && (
        // Drag handle - shown on hover when draggable (hover disabled on small screens to prevent double-tap on mobile)
        <div className="flex items-center mt-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
          <IconGripVertical size={16} className="text-content-subtle" />
        </div>
      )}

      {/* Timeline flag icon as marker */}
      <div className="flex flex-col items-center mt-1">
        {isCompleted ? (
          <IconFlagFilled size={20} className={classNames("flex-shrink-0", "text-accent-1")} />
        ) : (
          <IconFlag
            size={20}
            className={classNames("flex-shrink-0", milestone.dueDate ? "text-content-dimmed" : "text-content-subtle")}
          />
        )}
        {/* Connecting line for all but last item */}
        {!isLast && <div className="w-px h-8 bg-stroke-base mt-1" />}
      </div>

      {/* Milestone content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-start">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Link
              to={milestone.link!}
              className={classNames(
                "font-medium text-content-strong hover:text-accent-base transition-colors flex items-center gap-2",
              )}
            >
              {/* Remove flag icon from here, it's now the marker */}
              {milestone.name}
            </Link>

            <MilestoneIndicators
              hasDescription={milestone.hasDescription}
              hasComments={milestone.hasComments}
              commentCount={milestone.commentCount}
              className="flex-shrink-0"
            />

            {canEdit && (
              // Edit button - shown on hover on medium+ screens (hover disabled on small screens to prevent double-tap on mobile)
              <div className="opacity-0 md:group-hover:opacity-100 transition-opacity">
                <SecondaryButton testId={editBtnTestId} size="xxs" onClick={() => setIsEditing(true)}>
                  Edit
                </SecondaryButton>
              </div>
            )}
          </div>
        </div>
        {milestone.dueDate && (
          <div className={classNames("text-sm mt-1 flex items-center gap-1", dueDateColorClass)}>
            <DateField
              date={milestone.dueDate}
              readonly
              // This is needed to force the DateField to re-render when the due date changes
              key={`${milestone.id}-${milestone.dueDate?.value}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface MilestoneIndicatorsProps {
  hasDescription?: boolean;
  hasComments?: boolean;
  commentCount?: number;
  className?: string;
}

function MilestoneIndicators({ hasDescription, hasComments, commentCount, className }: MilestoneIndicatorsProps) {
  if (!hasDescription && !hasComments) {
    return null;
  }

  return (
    <div className={classNames("flex items-center gap-1 text-content-dimmed", className)}>
      {hasDescription && (
        <span className="flex items-center" data-test-id="description-indicator">
          <IconFileText size={12} />
        </span>
      )}

      {hasComments && (
        <span className="flex items-center" data-test-id="comments-indicator">
          <IconMessageCircle size={12} />
          {commentCount && <span className="ml-0.5 text-xs">{commentCount}</span>}
        </span>
      )}
    </div>
  );
}
