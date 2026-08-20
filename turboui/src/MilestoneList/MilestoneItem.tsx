import React, { useState } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { IconFileText, IconFlag, IconFlagFilled, IconGripVertical, IconMessageCircle } from "../icons";
import { Link } from "../Link";
import { RelativeDayField } from "../RelativeDayField";
import { TextField } from "../TextField";
import { createTestId } from "../TestableElement";
import { useSortableItem } from "../utils/PragmaticDragAndDrop";
import classNames from "../utils/classnames";
import type { DisplayMilestone, MilestoneListVariant } from "./types";

interface MilestoneItemProps {
  variant: MilestoneListVariant;
  milestone: DisplayMilestone;
  index: number;
  isLast: boolean;
  canEdit: boolean;
  isDraggable: boolean;
  containerId: string;
  onUpdate?: (milestoneId: string, title: string, due: DateField.ContextualDate | number | null) => void;
}

export function MilestoneItem({
  variant,
  milestone,
  index,
  isLast,
  canEdit,
  isDraggable,
  containerId,
  onUpdate,
}: MilestoneItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(milestone.title);
  const [editDueDate, setEditDueDate] = useState<DateField.ContextualDate | null>(milestone.dueDate);
  const [editDueOffsetDays, setEditDueOffsetDays] = useState<number | null>(milestone.dueOffsetDays);

  const { ref: draggableRef, isDragging } = useSortableItem<HTMLDivElement>({
    itemId: milestone.id,
    index,
    containerId,
    disabled: !isDraggable,
  });

  const milestoneTestId = createTestId("milestone", milestone.title);
  const editBtnTestId = createTestId("edit-btn", milestone.title);
  const editFormTestId = createTestId("edit-form", milestone.title);
  const nameTestId = createTestId("edit-title", milestone.title);
  const dueDateTestId = createTestId("edit-due-date", milestone.title);
  const dueOffsetTestId = createTestId("edit-due-offset", milestone.title);

  const isCompleted = variant === "project" && milestone.status === "done";
  const hasDue = variant === "project" ? !!milestone.dueDate : milestone.dueOffsetDays !== null;
  const isDueDateInPast =
    variant === "project" && milestone.dueDate?.date
      ? milestone.dueDate.date < new Date(new Date().setHours(0, 0, 0, 0))
      : false;
  const dueDateColorClass =
    variant === "project" && !isCompleted && isDueDateInPast ? "text-content-error" : "text-content-dimmed";

  const handleSave = () => {
    const title = editTitle.trim();
    if (!title) return;

    onUpdate?.(milestone.id, title, variant === "project" ? editDueDate : editDueOffsetDays);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(milestone.title);
    setEditDueDate(milestone.dueDate);
    setEditDueOffsetDays(milestone.dueOffsetDays);
    setIsEditing(false);
  };

  const flagMarker = (
    <div className="mt-1 flex flex-col items-center">
      {isCompleted ? (
        <IconFlagFilled size={20} className="flex-shrink-0 text-accent-1" />
      ) : (
        <IconFlag
          size={20}
          className={classNames("flex-shrink-0", hasDue ? "text-content-dimmed" : "text-content-subtle")}
        />
      )}
      {!isLast && <div className="mt-1 h-8 w-px bg-stroke-base" />}
    </div>
  );

  if (isEditing) {
    return (
      <div className="flex items-start gap-3" data-test-id={editFormTestId}>
        {flagMarker}
        <div className="min-w-0 flex-1 pb-6">
          <div className="rounded-lg border border-stroke-base bg-surface-dimmed p-4">
            <div className="space-y-3">
              <TextField
                variant="form-field"
                text={editTitle}
                onChange={setEditTitle}
                placeholder="Enter milestone title"
                autofocus
                onChangeOnType
                trimBeforeSave
                testId={nameTestId}
              />
              {variant === "project" ? (
                <DateField
                  date={editDueDate}
                  onDateSelect={setEditDueDate}
                  placeholder="Due date (optional)"
                  testId={dueDateTestId}
                  calendarOnly
                />
              ) : (
                <RelativeDayField
                  value={editDueOffsetDays}
                  onChange={setEditDueOffsetDays}
                  placeholder="Set relative date"
                  testId={dueOffsetTestId}
                />
              )}
              <div className="flex gap-2">
                <PrimaryButton size="sm" onClick={handleSave} disabled={!editTitle.trim()}>
                  Save
                </PrimaryButton>
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
      className={classNames(
        "group relative flex items-start gap-3",
        isDragging && "opacity-50",
        isDraggable && "cursor-grab active:cursor-grabbing",
      )}
      data-test-id={milestoneTestId}
    >
      {isDraggable && (
        <div className="mt-1 flex items-center opacity-0 transition-opacity md:group-hover:opacity-100">
          <IconGripVertical size={16} className="text-content-subtle" />
        </div>
      )}
      {flagMarker}
      <div className="min-w-0 flex-1 pb-2">
        <div className="flex items-center gap-2">
          <Link
            to={milestone.link}
            className="flex items-center gap-2 font-medium text-content-strong transition-colors hover:text-accent-base"
          >
            {milestone.title}
          </Link>
          {variant === "project" && (
            <MilestoneIndicators
              hasDescription={milestone.hasDescription}
              hasComments={milestone.hasComments}
              commentCount={milestone.commentCount}
              className="flex-shrink-0"
            />
          )}
          {canEdit && (
            <div className="opacity-0 transition-opacity md:group-hover:opacity-100">
              <SecondaryButton testId={editBtnTestId} size="xxs" onClick={() => setIsEditing(true)}>
                Edit
              </SecondaryButton>
            </div>
          )}
        </div>
        {variant === "project" && milestone.dueDate && (
          <div className={classNames("mt-1 flex items-center gap-1 text-sm", dueDateColorClass)}>
            <DateField date={milestone.dueDate} readonly key={`${milestone.id}-${milestone.dueDate?.value}`} />
          </div>
        )}
        {variant === "project-template" && milestone.dueOffsetDays !== null && (
          <div className="mt-1">
            <RelativeDayField
              value={milestone.dueOffsetDays}
              readonly
              testId={`template-milestone-${milestone.id}-due-offset`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneIndicators({
  hasDescription,
  hasComments,
  commentCount,
  className,
}: {
  hasDescription?: boolean;
  hasComments?: boolean;
  commentCount?: number;
  className?: string;
}) {
  if (!hasDescription && !hasComments) return null;

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
          {commentCount ? <span className="ml-0.5 text-xs">{commentCount}</span> : null}
        </span>
      )}
    </div>
  );
}
