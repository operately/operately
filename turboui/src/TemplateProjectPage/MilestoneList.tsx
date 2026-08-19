import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect, useRef, useState } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { RelativeDayField } from "../RelativeDayField";
import { IconFlag, IconGripVertical } from "../icons";
import { Link } from "../Link";
import { TextField } from "../TextField";
import { createTestId } from "../TestableElement";
import {
  projectItemsWithPlaceholder,
  SubtleDropPlaceholder,
  useBoardDnD,
  useSortableItem,
} from "../utils/PragmaticDragAndDrop";
import type { BoardMove } from "../utils/PragmaticDragAndDrop";
import classNames from "../utils/classnames";
import type { TemplateProjectPage } from ".";
import { MilestoneFormModal } from "./MilestoneFormModal";

export function MilestoneList({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
  const [isCreating, setIsCreating] = React.useState(false);

  const isDraggingEnabled = canEdit && !!props.onMilestoneReorder;
  const containerId = "template-milestone-list";
  const listRef = useRef<HTMLDivElement>(null);
  const handleMilestoneMove = React.useCallback(
    (move: BoardMove) => {
      if (!isDraggingEnabled) return;
      props.onMilestoneReorder?.(move.itemId, move.destination.index);
    },
    [isDraggingEnabled, props.onMilestoneReorder],
  );
  const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(handleMilestoneMove);
  const activeDraggedItemId = isDraggingEnabled ? draggedItemId : null;
  const activeDestination = isDraggingEnabled ? destination : null;
  const { items: projectedMilestones, placeholderIndex } = React.useMemo(
    () =>
      projectItemsWithPlaceholder({
        items: props.milestones,
        getId: (milestone) => milestone.id,
        draggedItemId: activeDraggedItemId,
        targetLocation: activeDestination,
        containerId,
      }),
    [activeDestination, activeDraggedItemId, containerId, props.milestones],
  );

  useEffect(() => {
    if (!isDraggingEnabled) return;

    const element = listRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ containerId, index: projectedMilestones.length }),
    });
  }, [containerId, isDraggingEnabled, projectedMilestones.length]);

  return (
    <section className="border-t border-surface-outline pt-8" data-test-id="template-milestones">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-bold">Milestones</h2>
        {canEdit && (
          <SecondaryButton size="xxs" onClick={() => setIsCreating(true)} testId="add-template-milestone-overview">
            Add milestone
          </SecondaryButton>
        )}
      </div>
      <div ref={listRef} className={classNames("space-y-2", { "-ml-8": isDraggingEnabled })}>
        {projectedMilestones.map((milestone, index) => (
          <React.Fragment key={milestone.id}>
            {placeholderIndex === index && (
              <SubtleDropPlaceholder
                containerId={containerId}
                index={index}
                height={draggedItemDimensions?.height ?? null}
              />
            )}
            <MilestoneItem
              milestone={milestone}
              index={index}
              isLast={index === projectedMilestones.length - 1}
              canEdit={canEdit}
              isDraggable={isDraggingEnabled}
              onUpdate={props.onMilestoneUpdate}
            />
          </React.Fragment>
        ))}
        {placeholderIndex !== null && placeholderIndex === projectedMilestones.length && (
          <SubtleDropPlaceholder
            containerId={containerId}
            index={projectedMilestones.length}
            height={draggedItemDimensions?.height ?? null}
          />
        )}
        {props.milestones.length === 0 && (
          <p className="py-6 text-center text-sm text-content-dimmed">No milestones yet</p>
        )}
      </div>
      <MilestoneFormModal isOpen={isCreating} onClose={() => setIsCreating(false)} onCreate={props.onMilestoneCreate} />
    </section>
  );
}

interface MilestoneItemProps {
  milestone: TemplateProjectPage.Milestone;
  index: number;
  isLast: boolean;
  canEdit: boolean;
  isDraggable: boolean;
  onUpdate?: TemplateProjectPage.Props["onMilestoneUpdate"];
}

function MilestoneItem({ milestone, index, isLast, canEdit, isDraggable, onUpdate }: MilestoneItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(milestone.title);
  const [editDueOffsetDays, setEditDueOffsetDays] = useState<number | null>(milestone.dueOffsetDays);
  const { ref: draggableRef, isDragging } = useSortableItem<HTMLDivElement>({
    itemId: milestone.id,
    index,
    containerId: "template-milestone-list",
    disabled: !isDraggable,
  });
  const milestoneTestId = createTestId("milestone", milestone.title);
  const editBtnTestId = createTestId("edit-btn", milestone.title);
  const editFormTestId = createTestId("edit-form", milestone.title);
  const nameTestId = createTestId("edit-title", milestone.title);
  const dueOffsetTestId = createTestId("edit-due-offset", milestone.title);

  const handleSave = () => {
    onUpdate?.(milestone.id, {
      title: editTitle.trim(),
      dueOffsetDays: editDueOffsetDays,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(milestone.title);
    setEditDueOffsetDays(milestone.dueOffsetDays);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-3" data-test-id={editFormTestId}>
        <div className="mt-1 flex flex-col items-center">
          <IconFlag
            size={20}
            className={
              milestone.dueOffsetDays === null ? "shrink-0 text-content-subtle" : "shrink-0 text-content-dimmed"
            }
          />
          {!isLast && <div className="mt-1 h-8 w-px bg-stroke-base" />}
        </div>
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
              <RelativeDayField
                value={editDueOffsetDays}
                onChange={setEditDueOffsetDays}
                placeholder="Set relative date"
                testId={dueOffsetTestId}
              />
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
      <div className="mt-1 flex flex-col items-center">
        <IconFlag
          size={20}
          className={milestone.dueOffsetDays === null ? "shrink-0 text-content-subtle" : "shrink-0 text-content-dimmed"}
        />
        {!isLast && <div className="mt-1 h-8 w-px bg-stroke-base" />}
      </div>
      <div className="min-w-0 flex-1 pb-2">
        <div className="flex items-center gap-2">
          <Link
            to={milestone.link}
            className="flex items-center gap-2 font-medium text-content-strong transition-colors hover:text-accent-base"
          >
            {milestone.title}
          </Link>
          {canEdit && (
            <div className="opacity-0 transition-opacity md:group-hover:opacity-100">
              <SecondaryButton testId={editBtnTestId} size="xxs" onClick={() => setIsEditing(true)}>
                Edit
              </SecondaryButton>
            </div>
          )}
        </div>
        {milestone.dueOffsetDays !== null && (
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
