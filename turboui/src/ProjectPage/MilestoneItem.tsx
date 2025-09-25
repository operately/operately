import React, { useRef, useState } from "react";
import { PrimaryButton as Button, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { IconFlag, IconFlagFilled, IconGripVertical } from "../icons";
import { Link } from "../Link";
import { useDraggable } from "../utils/DragAndDrop";
import * as TaskBoardTypes from "../TaskBoard/types";
import classNames from "../utils/classnames";
import { createTestId } from "../TestableElement";

interface MilestoneItemProps {
  milestone: TaskBoardTypes.Milestone;
  canEdit: boolean;
  onUpdate?: (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => void;
  isLast?: boolean;
  dragZoneId: string;
  draggingDisabled?: boolean;
}

export function MilestoneItem({
  milestone,
  canEdit,
  onUpdate,
  isLast = false,
  dragZoneId,
  draggingDisabled = false,
}: MilestoneItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(milestone.name);
  const [editDueDate, setEditDueDate] = useState<DateField.ContextualDate | null>(milestone.dueDate || null);

  const milestoneTestId = createTestId("milestone", milestone.name);
  const editBtnTestId = createTestId("edit-btn", milestone.name);
  const editFormTestId = createTestId("edit-form", milestone.name);
  const nameTestId = createTestId("edit-title", milestone.name);
  const dateTestId = createTestId("edit-due-date", milestone.name);

  const isCompleted = milestone.status === "done";
  const draggingIsDisabled = draggingDisabled || !canEdit;
  const handleRef = useRef<HTMLSpanElement | null>(null);

  const { ref, isDragging } = useDraggable({
    id: milestone.id,
    zoneId: dragZoneId,
    disabled: draggingIsDisabled || isEditing,
    handle: handleRef,
  });

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

  if (isEditing) {
    return (
      <li ref={ref as React.RefObject<HTMLLIElement>} className="list-none" data-test-id={editFormTestId}>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1">
            {isCompleted ? (
              <IconFlagFilled size={20} className={classNames("flex-shrink-0", "bg-callout-success-content")} />
            ) : (
              <IconFlag
                size={20}
                className={classNames(
                  "flex-shrink-0",
                  milestone.dueDate ? "text-content-dimmed" : "text-content-subtle",
                )}
              />
            )}
            {!isLast && <div className="w-px h-8 bg-stroke-base mt-1" />}
          </div>

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
      </li>
    );
  }

  return (
    <li
      ref={ref as React.RefObject<HTMLLIElement>}
      className={classNames("list-none", isDragging ? "ring-2 ring-accent-base rounded-lg bg-surface-base" : "")}
      data-test-id={milestoneTestId}
    >
      <div className="flex items-start gap-3 group">
        {!draggingIsDisabled && (
          <span
            ref={handleRef as React.RefObject<HTMLSpanElement>}
            className="flex items-center pt-1 text-content-subtle hover:text-content-base cursor-grab active:cursor-grabbing"
          >
            <IconGripVertical size={16} />
            <span className="sr-only">Drag to reorder milestone</span>
          </span>
        )}
        <div className="flex flex-col items-center mt-1">
          {isCompleted ? (
            <IconFlagFilled size={20} className={classNames("flex-shrink-0", "text-accent-1")} />
          ) : (
            <IconFlag
              size={20}
              className={classNames("flex-shrink-0", milestone.dueDate ? "text-content-dimmed" : "text-content-subtle")}
            />
          )}
          {!isLast && <div className="w-px h-6 bg-stroke-base mt-1" />}
        </div>

        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link
                to={milestone.link!}
                className={classNames(
                  "font-medium transition-colors flex items-center gap-2",
                  isCompleted ? "text-content-subtle line-through" : "text-content-strong hover:text-accent-base",
                )}
              >
                {milestone.name}
              </Link>
              {milestone.dueDate && (
                <div
                  className={classNames(
                    "text-sm mt-1 flex items-center gap-1",
                    !isCompleted && milestone.dueDate?.date < new Date(new Date().setHours(0, 0, 0, 0))
                      ? "text-content-error"
                      : "text-content-dimmed",
                  )}
                >
                  <DateField
                    date={milestone.dueDate}
                    readonly={!canEdit}
                    key={`${milestone.id}-${milestone.dueDate?.value}`}
                  />
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <SecondaryButton testId={editBtnTestId} size="xxs" onClick={() => setIsEditing(true)}>
                  Edit
                </SecondaryButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
