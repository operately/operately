import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect, useRef } from "react";
import { DangerButton, SecondaryButton } from "../Button";
import { RelativeDayField } from "../RelativeDayField";
import { TextField } from "../TextField";
import { WarningCallout } from "../Callouts";
import { IconFlag, IconGripVertical, IconTrash } from "../icons";
import {
  projectItemsWithPlaceholder,
  SubtleDropPlaceholder,
  useBoardDnD,
  useSortableItem,
} from "../utils/PragmaticDragAndDrop";
import type { BoardMove } from "../utils/PragmaticDragAndDrop";
import classNames from "../utils/classnames";
import Modal from "../Modal";
import type { TemplateProjectPage } from ".";
import { MilestoneFormModal } from "./MilestoneFormModal";

export function MilestoneList({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = React.useState<TemplateProjectPage.Milestone | null>(null);

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
              props={props}
              canEdit={canEdit}
              isDraggable={isDraggingEnabled}
              onDelete={setMilestoneToDelete}
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
      <DeleteMilestoneModal
        milestone={milestoneToDelete}
        onClose={() => setMilestoneToDelete(null)}
        onDelete={(milestoneId) => props.onMilestoneDelete?.(milestoneId)}
      />
      <MilestoneFormModal isOpen={isCreating} onClose={() => setIsCreating(false)} onCreate={props.onMilestoneCreate} />
    </section>
  );
}

function DeleteMilestoneModal({
  milestone,
  onClose,
  onDelete,
}: {
  milestone: TemplateProjectPage.Milestone | null;
  onClose: () => void;
  onDelete: (milestoneId: string) => void | Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!milestone) return;

    setIsDeleting(true);

    try {
      await onDelete(milestone.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={milestone !== null}
      onClose={onClose}
      size="large"
      title={`Delete ${milestone?.title ?? "milestone"}`}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <WarningCallout
          message="This action cannot be undone"
          description={`Deleting the ${milestone?.title ?? "selected"} milestone is permanent and cannot be undone.`}
        />

        <div className="flex items-center gap-2">
          <DangerButton
            size="sm"
            type="submit"
            loading={isDeleting}
            disabled={isDeleting}
            testId="delete-template-milestone"
          >
            Delete Forever
          </DangerButton>
          <SecondaryButton size="sm" onClick={onClose} testId="cancel-delete-template-milestone">
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}

interface MilestoneItemProps {
  milestone: TemplateProjectPage.Milestone;
  index: number;
  isLast: boolean;
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  isDraggable: boolean;
  onDelete: (milestone: TemplateProjectPage.Milestone) => void;
}

function MilestoneItem({ milestone, index, isLast, props, canEdit, isDraggable, onDelete }: MilestoneItemProps) {
  const { ref: draggableRef, isDragging } = useSortableItem<HTMLDivElement>({
    itemId: milestone.id,
    index,
    containerId: "template-milestone-list",
    disabled: !isDraggable,
  });

  return (
    <div
      ref={draggableRef}
      className={classNames(
        "group relative flex items-start gap-3",
        isDragging && "opacity-50",
        isDraggable && "cursor-grab active:cursor-grabbing",
      )}
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
      <div className="relative min-w-0 flex-1 pb-2 pr-8">
        <TextField
          text={milestone.title}
          onChange={(title) => void props.onMilestoneUpdate?.(milestone.id, { title })}
          readonly={!canEdit}
          className="font-medium"
          testId={`template-milestone-${milestone.id}-title`}
        />
        {canEdit && props.onMilestoneDelete && (
          <div className="absolute top-0 right-0 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
            <button
              type="button"
              className="block rounded-full p-1.5 text-content-dimmed hover:bg-surface-dimmed hover:text-content-error"
              onClick={() => onDelete(milestone)}
              aria-label={`Delete ${milestone.title}`}
              data-test-id={`delete-template-milestone-${milestone.id}`}
            >
              <IconTrash size={16} />
            </button>
          </div>
        )}
        <RelativeDayField
          value={milestone.dueOffsetDays}
          onChange={(dueOffsetDays) => props.onMilestoneUpdate?.(milestone.id, { dueOffsetDays })}
          readonly={!canEdit}
          testId={`template-milestone-${milestone.id}-due-offset`}
        />
      </div>
    </div>
  );
}
