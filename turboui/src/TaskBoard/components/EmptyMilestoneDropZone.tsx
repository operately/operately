import React, { useEffect, useRef } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { DropPlaceholder } from "../../utils/PragmaticDragAndDrop";
import type { BoardLocation } from "../../utils/PragmaticDragAndDrop";

export interface EmptyMilestoneDropZoneProps {
  milestoneId: string;
  children?: React.ReactNode;
  draggedItemId?: string | null;
  targetLocation?: BoardLocation | null;
  placeholderHeight?: number | null;
}

/**
 * Empty milestone drop zone component that allows dropping tasks into empty milestones
 * This provides a visual cue and drop target when a milestone has no tasks
 */
export function EmptyMilestoneDropZone({
  milestoneId,
  children,
  draggedItemId = null,
  targetLocation = null,
  placeholderHeight = null,
}: EmptyMilestoneDropZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId: milestoneId,
        index: 0,
      }),
    });
  }, [milestoneId]);

  const shouldShowPlaceholder = Boolean(draggedItemId && targetLocation?.containerId === milestoneId);
  const placeholderIndex = targetLocation?.containerId === milestoneId ? targetLocation.index : 0;

  return (
    <div ref={containerRef} className="py-3 px-4 min-h-[40px] bg-surface-base">
      {shouldShowPlaceholder && (
        <div className="mb-3">
          <DropPlaceholder containerId={milestoneId} index={placeholderIndex} height={placeholderHeight} />
        </div>
      )}
      {children ? (
        children
      ) : (
        <div className="text-center text-content-subtle text-sm">
          Click + or press c to add a task, or drag a task here.
        </div>
      )}
    </div>
  );
}

export default EmptyMilestoneDropZone;
