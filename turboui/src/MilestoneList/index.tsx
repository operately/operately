import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { PieChart } from "../PieChart";
import { SectionHeader } from "../TaskPage/SectionHeader";
import { projectItemsWithPlaceholder, SubtleDropPlaceholder, useBoardDnD } from "../utils/PragmaticDragAndDrop";
import type { BoardMove } from "../utils/PragmaticDragAndDrop";
import classNames from "../utils/classnames";
import { AddMilestoneForm } from "./AddMilestoneForm";
import { EmptyState } from "./EmptyState";
import { MilestoneItem } from "./MilestoneItem";
import {
  isProjectVariant,
  toDisplayMilestones,
  type MilestoneListProps,
} from "./types";

export type { MilestoneListProps } from "./types";
export type {
  ProjectMilestoneCreatePayload,
  ProjectMilestoneUpdatePayload,
  TemplateMilestone,
  TemplateMilestoneCreatePayload,
  TemplateMilestoneUpdatePayload,
} from "./types";

export function MilestoneList(props: MilestoneListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const milestones = useMemo(() => toDisplayMilestones(props), [props.milestones, props.variant]);
  const isDraggingEnabled = !!(props.onMilestoneReorder && props.canEdit);
  const containerId = props.variant === "project" ? "milestone-list" : "template-milestone-list";
  const listRef = useRef<HTMLDivElement>(null);
  const sectionTestId = props.variant === "project" ? "timeline-section" : "template-milestones";
  const addButtonTestId = props.variant === "project" ? "add-milestone-button" : "add-template-milestone-overview";

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

  const { items: projectedMilestones, placeholderIndex } = useMemo(
    () =>
      projectItemsWithPlaceholder({
        items: milestones,
        getId: (milestone) => milestone.id,
        draggedItemId: activeDraggedItemId,
        targetLocation: activeDestination,
        containerId,
      }),
    [activeDestination, activeDraggedItemId, containerId, milestones],
  );

  useEffect(() => {
    if (!isDraggingEnabled) return;

    const element = listRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId,
        index: projectedMilestones.length,
      }),
    });
  }, [containerId, isDraggingEnabled, projectedMilestones.length]);

  const totalMilestones = milestones.length;
  const completedCount = milestones.filter((milestone) => milestone.status === "done").length;
  const completionPercentage = totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0;

  const handleCreate = async (title: string, due: DateField.ContextualDate | number | null) => {
    if (isProjectVariant(props)) {
      const result = await Promise.resolve(
        props.onMilestoneCreate?.({
          name: title,
          dueDate: due as DateField.ContextualDate | null,
          status: "pending",
        }),
      );
      if (result && typeof result === "object" && "success" in result && !result.success) {
        return false;
      }
      return true;
    }

    props.onMilestoneCreate?.({
      title,
      description: null,
      dueOffsetDays: due as number | null,
    });
    return true;
  };

  const handleUpdate = (milestoneId: string, title: string, due: DateField.ContextualDate | number | null) => {
    if (isProjectVariant(props)) {
      props.onMilestoneUpdate?.(milestoneId, {
        name: title,
        dueDate: due as DateField.ContextualDate | null,
      });
      return;
    }

    props.onMilestoneUpdate?.(milestoneId, {
      title,
      dueOffsetDays: due as number | null,
    });
  };

  return (
    <div className="space-y-4" data-test-id={sectionTestId}>
      <div className="flex items-center gap-2">
        <SectionHeader title="Milestones" />
        {props.variant === "project" && totalMilestones > 0 && (
          <div className="flex items-center gap-1 text-sm text-content-accent">
            <PieChart size={16} slices={[{ percentage: completionPercentage, color: "var(--color-green-500)" }]} />
            <span>
              {completedCount}/{totalMilestones} completed
            </span>
          </div>
        )}
        {props.canEdit && (
          <SecondaryButton size="xxs" onClick={() => setShowAddForm(true)} testId={addButtonTestId}>
            Add milestone
          </SecondaryButton>
        )}
      </div>

      <div className="space-y-6">
        {projectedMilestones.length > 0 && (
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
                  variant={props.variant}
                  milestone={milestone}
                  index={index}
                  isLast={index === projectedMilestones.length - 1}
                  canEdit={props.canEdit}
                  isDraggable={isDraggingEnabled}
                  containerId={containerId}
                  onUpdate={handleUpdate}
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
          </div>
        )}

        <EmptyState
          display={milestones.length === 0 && !showAddForm}
          canEdit={props.canEdit}
          onAdd={() => setShowAddForm(true)}
        />

        <AddMilestoneForm
          variant={props.variant}
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
}
