import React from "react";
import { useDropZone } from "../../utils/DragAndDrop";

export interface EmptyMilestoneDropZoneProps {
  /**
   * ID of the milestone this empty drop zone represents
   */
  milestoneId: string;
  
  /**
   * Optional callback that will be called when the user wants to create a new task in this milestone
   */
  onTaskCreation?: () => void;
}

/**
 * Empty milestone drop zone component that allows dropping tasks into empty milestones
 * This provides a visual cue and drop target when a milestone has no tasks
 */
export function EmptyMilestoneDropZone({ milestoneId, onTaskCreation }: EmptyMilestoneDropZoneProps) {
  // Set up drop zone with the same ID pattern as TaskList
  const { ref } = useDropZone({ id: milestoneId, dependencies: [] });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="py-3 px-4 text-center text-content-subtle text-sm min-h-[40px] bg-surface-base"
      onClick={onTaskCreation}
    >
      Click + to add a task or drag a task here.
    </div>
  );
}

export default EmptyMilestoneDropZone;
