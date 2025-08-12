import * as Types from "../types";

/**
 * Helper function to group tasks by milestone ID
 */
export const groupTasksByMilestone = (tasks: Types.Task[]): Record<string, Types.Task[]> => {
  const groupedTasks: Record<string, Types.Task[]> = {
    no_milestone: [],
  };

  tasks.forEach((task) => {
    const milestoneId = task.milestone?.id || "no_milestone";
    
    if (!groupedTasks[milestoneId]) {
      groupedTasks[milestoneId] = [];
    }
    
    groupedTasks[milestoneId]!.push(task);
  });

  return groupedTasks;
};

/**
 * Interface for reordering options
 */
export interface ReorderTasksOptions {
  /**
   * Whether to add helper tasks to empty milestones after reordering
   */
  addHelperTasks?: boolean;
}

/**
 * Function to handle task reordering within a single list (same milestone)
 */
export const reorderTasksInList = (
  tasks: Types.Task[],
  draggedTaskId: string,
  newIndex: number
): Types.Task[] => {
  // Create a copy of the tasks
  const updatedTasks = [...tasks];
  
  // Find the task being dragged
  const draggedTaskIndex = updatedTasks.findIndex(task => task.id === draggedTaskId);
  
  if (draggedTaskIndex === -1) {
    // Task not found, return original array
    return tasks;
  }
  
  // Remove the task from its current position
  const [draggedTask] = updatedTasks.splice(draggedTaskIndex, 1);
  
  // Insert at the new position, ensuring it's within bounds
  const insertIndex = Math.min(newIndex, updatedTasks.length);
  updatedTasks.splice(insertIndex, 0, draggedTask!);
  
  return updatedTasks;
};

/**
 * Function to handle task reordering across different milestones
 */
export const reorderTasksAcrossMilestones = (
  tasks: Types.Task[],
  draggedTaskId: string,
  targetMilestoneId: string,
  indexInTargetMilestone: number,
  options: ReorderTasksOptions = {},
  milestones?: Types.Milestone[]
): Types.Task[] => {
  // Create a copy of the tasks
  const updatedTasks = [...tasks];
  
  // Find the task being dragged
  const draggedTaskIndex = updatedTasks.findIndex(task => task.id === draggedTaskId);
  
  if (draggedTaskIndex === -1) {
    // Task not found, return original array
    return tasks;
  }
  
  // Get the task and remember its original milestone
  const draggedTask = updatedTasks[draggedTaskIndex]!;
  const originalMilestoneId = draggedTask.milestone?.id;
  
  // Remove the task from its current position
  updatedTasks.splice(draggedTaskIndex, 1);
  
  // Group tasks by milestone to find the insertion point
  const tasksByMilestone = groupTasksByMilestone(updatedTasks);
  
  // Handle the milestone assignment for the dragged task
  if (targetMilestoneId === "no-milestone") {
    // Remove milestone assignment if dropped in no-milestone zone
    draggedTask.milestone = null;
  } else if (targetMilestoneId !== originalMilestoneId && milestones) {
    // Find the milestone object to assign
    const targetMilestone = milestones.find(m => m.id === targetMilestoneId);
    if (targetMilestone) {
      draggedTask.milestone = targetMilestone;
    }
  }
  
  // Determine where to insert the task in the overall array
  let globalInsertIndex = 0;
  
  if (targetMilestoneId === "no-milestone") {
    // For no-milestone, count tasks in other milestones that come first
    for (const milestoneId in tasksByMilestone) {
      if (milestoneId === "no_milestone") break;
      globalInsertIndex += tasksByMilestone[milestoneId]?.length || 0;
    }
    
    const noMilestoneTasks = tasksByMilestone["no_milestone"] || [];
    globalInsertIndex += Math.min(indexInTargetMilestone, noMilestoneTasks.length);
  } else {
    // For a specific milestone, count tasks up to that milestone
    for (const milestoneId in tasksByMilestone) {
      if (milestoneId === targetMilestoneId) break;
      globalInsertIndex += tasksByMilestone[milestoneId]?.length || 0;
    }
    
    // Add the insertion index within the milestone
    const targetMilestoneTasks = tasksByMilestone[targetMilestoneId] || [];
    globalInsertIndex += Math.min(indexInTargetMilestone, targetMilestoneTasks.length);
  }
  
  // Insert the task at the calculated position
  updatedTasks.splice(globalInsertIndex, 0, draggedTask);
  
  // Check if we need to add helper tasks for empty milestones
  if (options.addHelperTasks && originalMilestoneId && originalMilestoneId !== targetMilestoneId) {
    // Check if there are any non-helper tasks remaining in the original milestone
    const hasRealTasks = updatedTasks.some(
      task => !task._isHelperTask && task.milestone?.id === originalMilestoneId
    );
    
    // If no real tasks remain and this milestone doesn't already have a helper task
    const hasHelperTask = updatedTasks.some(
      task => task._isHelperTask && task.milestone?.id === originalMilestoneId
    );
    
    if (!hasRealTasks && !hasHelperTask && milestones) {
      // Find the original milestone object
      const originalMilestone = milestones.find(m => m.id === originalMilestoneId);
      
      if (originalMilestone) {
        // Create a helper task to keep the empty milestone visible
        const helperTask: Types.Task = {
          id: `task-helper-${originalMilestoneId}-${Date.now()}`,
          title: `Helper task for ${originalMilestone.name}`,
          status: "pending",
          description: null,
          dueDate: null,
          milestone: originalMilestone,
          _isHelperTask: true,
        };
        
        // Add the helper task to the updated tasks
        updatedTasks.push(helperTask);
      }
    }
  }
  
  return updatedTasks;
};

/**
 * Main function to handle task reordering, works for both single-list and cross-milestone cases
 */
export const reorderTasks = (
  tasks: Types.Task[],
  dropZoneId: string,
  draggedTaskId: string,
  indexInDropZone: number,
  options: ReorderTasksOptions = {},
  milestones?: Types.Milestone[]
): Types.Task[] => {
  // Extract milestone ID from dropZoneId (format: milestone-{id})
  let targetMilestoneId = dropZoneId;
  
  // Handle different possible formats of dropZoneId
  if (dropZoneId.startsWith('milestone-')) {
    targetMilestoneId = dropZoneId.replace('milestone-', '');
  }
  
  console.log(`Processing drag operation: ${draggedTaskId} to ${dropZoneId} at index ${indexInDropZone}`);
  console.log(`Extracted milestone ID: ${targetMilestoneId} from dropZone: ${dropZoneId}`);
  
  // For debugging - show first few tasks to avoid flooding logs
  console.log(`First few tasks:`, tasks.slice(0, 3).map(t => ({ id: t.id, milestone: t.milestone?.id || 'none' })));
  console.log(`First few milestones:`, milestones?.slice(0, 3).map(m => ({ id: m.id, name: m.name })) || 'none');
  
  // Find the dragged task
  const draggedTask = tasks.find(task => task.id === draggedTaskId);
  if (!draggedTask) {
    console.log(`Task not found: ${draggedTaskId}`);
    return tasks; // Task not found
  }
  
  // Check if we're reordering within the same milestone
  const currentMilestoneId = draggedTask.milestone?.id || "no-milestone";
  
  // Normalize the target milestone ID to handle both formats
  let normalizedTargetId = targetMilestoneId;
  if (targetMilestoneId === "no-milestone") {
    normalizedTargetId = "no-milestone";
  }
  
  console.log(`Current milestone: ${currentMilestoneId}, target: ${normalizedTargetId}`);
  // Always use the across-milestones function for the main TaskBoard component,
  // but still use the same-milestone logic for the standalone components
  // For now, always use reorderTasksAcrossMilestones for all cases.
  // This provides the most consistent behavior across components
  console.log(`Using cross-milestone reordering for all cases`);
  
  return reorderTasksAcrossMilestones(
    tasks,
    draggedTaskId,
    normalizedTargetId, // Using normalized target ID
    indexInDropZone,
    options,
    milestones
  );
};
