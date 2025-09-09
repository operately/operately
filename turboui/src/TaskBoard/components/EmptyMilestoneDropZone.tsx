import React from "react";
import { useDropZone } from "../../utils/DragAndDrop";

export interface EmptyMilestoneDropZoneProps {
  milestoneId: string;
}

/**
 * Empty milestone drop zone component that allows dropping tasks into empty milestones
 * This provides a visual cue and drop target when a milestone has no tasks
 */
export function EmptyMilestoneDropZone({ milestoneId }: EmptyMilestoneDropZoneProps) {
  // Set up drop zone with the same ID pattern as TaskList
  const { ref } = useDropZone({ id: milestoneId, dependencies: [] });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="py-3 px-4 text-center text-content-subtle text-sm min-h-[40px] bg-surface-base"
    >
      Click + to add a task or drag a task here.
    </div>
  );
}

export default EmptyMilestoneDropZone;
