import React from "react";
import { useDropZone } from "../../utils/DragAndDrop";

export interface EmptyMilestoneDropZoneProps {
  milestoneId: string;
  children?: React.ReactNode;
}

/**
 * Empty milestone drop zone component that allows dropping tasks into empty milestones
 * This provides a visual cue and drop target when a milestone has no tasks
 */
export function EmptyMilestoneDropZone({ milestoneId, children }: EmptyMilestoneDropZoneProps) {
  // Set up drop zone with the same ID pattern as TaskList
  const { ref } = useDropZone({ id: milestoneId, dependencies: [], accepts: ["task"] });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="py-3 px-4 min-h-[40px] bg-surface-base">
      {children ? (
        children
      ) : (
        <div className="text-center text-content-subtle text-sm">Click + or press c to add a task, or drag a task here.</div>
      )}
    </div>
  );
}

export default EmptyMilestoneDropZone;
