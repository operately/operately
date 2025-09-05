import { TaskBoard } from "turboui";
import { EditMilestoneOrderingStateInput } from "@/api";

/**
 * Builds milestone ordering state arrays for the task milestone update mutation
 * 
 * @param milestones - List of all milestones with their current ordering states
 * @param task - The task being moved
 * @param targetMilestoneId - ID of the milestone where the task is being moved to
 * @param indexInTargetMilestone - Position in the target milestone
 * @returns Array of milestone ordering states that need to be updated
 */
export const buildMilestonesOrderingState = (
  milestones: TaskBoard.Milestone[],
  task: TaskBoard.Task,
  targetMilestoneId: string | null,
  indexInTargetMilestone: number
): EditMilestoneOrderingStateInput[] => {
  const sourceMilestoneId = task.milestone?.id || null;
  
  const milestonesOrderingState: EditMilestoneOrderingStateInput[] = [];
  
  // Check if the milestone has changed
  if (sourceMilestoneId !== targetMilestoneId) {
    // Update source milestone (if it exists) by removing the task
    if (sourceMilestoneId) {
      const sourceMilestone = milestones.find(m => m.id === sourceMilestoneId);

      if (sourceMilestone && sourceMilestone.tasksOrderingState) {
        // Create a new ordering state without the task
        const newSourceOrderingState = sourceMilestone.tasksOrderingState.filter(
          taskId => taskId !== task.id
        );
        
        milestonesOrderingState.push({
          milestoneId: sourceMilestoneId,
          orderingState: newSourceOrderingState,
        });
      }
    }
    
    // Update target milestone (if it exists) by adding the task
    if (targetMilestoneId) {
      const targetMilestone = milestones.find(m => m.id === targetMilestoneId);

      if (targetMilestone) {
        // Create a copy of the current ordering state or initialize empty array
        const newTargetOrderingState = [...(targetMilestone.tasksOrderingState || [])];
        
        // Insert task at the specified index
        newTargetOrderingState.splice(indexInTargetMilestone, 0, task.id);
        
        milestonesOrderingState.push({
          milestoneId: targetMilestoneId,
          orderingState: newTargetOrderingState,
        });
      }
    }
  } else {
    // Milestone hasn't changed - just update the ordering in the current milestone
    if (targetMilestoneId) {
      const milestone = milestones.find(m => m.id === targetMilestoneId);

      if (milestone) {
        // Remove the task from its current position
        const currentOrderingState = [...(milestone.tasksOrderingState || [])];
        const filteredOrderingState = currentOrderingState.filter(taskId => taskId !== task.id);
        
        // Insert the task at the new position
        filteredOrderingState.splice(indexInTargetMilestone, 0, task.id);
        
        milestonesOrderingState.push({
          milestoneId: targetMilestoneId,
          orderingState: filteredOrderingState,
        });
      }
    }
  }
  
  return milestonesOrderingState;
};
