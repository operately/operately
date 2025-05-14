import React, { useState } from "react";
import {
  IconFileText,
  IconMessageCircle,
  IconPlus,
} from "@tabler/icons-react";
import { BlackLink } from "../../Link";
import { PieChart } from "../../PieChart";
import { DueDateDisplay } from "./DueDateDisplay";
import { TaskList } from "./TaskList";
import { EmptyMilestoneDropZone } from "./EmptyMilestoneDropZone";
import * as Types from "../types";
import TaskCreationModal from "./TaskCreationModal";

export interface MilestoneCardProps {
  /**
   * The milestone to display
   */
  milestone: Types.Milestone;

  /**
   * The tasks associated with this milestone
   */
  tasks: Types.Task[];

  /**
   * Called when a new task is created for this milestone
   */
  onTaskCreate?: (task: Omit<Types.Task, "id">) => void;
  
  /**
   * Available milestones for task reassignment
   */
  availableMilestones?: Types.Milestone[];
  
  /**
   * Available people for task assignment
   */
  availablePeople?: Types.Person[];

  /**
   * Milestone statistics - if not provided, will be calculated from tasks
   */
  stats?: Types.MilestoneStats;
}

/**
 * MilestoneCard component displays a milestone with its tasks
 * It combines the milestone header with either a TaskList or EmptyMilestoneDropZone
 */
export function MilestoneCard({ 
  milestone, 
  tasks, 
  onTaskCreate, 
  stats,
  availableMilestones = [],
  availablePeople = []
}: MilestoneCardProps) {
  // Generate default stats if not provided
  const milestoneStats = stats || calculateMilestoneStats(tasks);
  
  // State for task creation modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Handle task creation
  const handleCreateTask = (newTask: Omit<Types.Task, "id">) => {
    if (onTaskCreate) {
      onTaskCreate(newTask);
    }
    // Close modal if not creating multiple tasks
    // (the modal handles this internally)
  };
  
  return (
    <>
      <li>
        {/* Milestone header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-dimmed border-b border-surface-outline">
          <div className="flex items-center gap-2">
            {/* Progress pie chart */}
            <PieChart
              size={16}
              slices={[
                {
                  percentage: calculateCompletionPercentage(milestoneStats),
                  color: "var(--color-callout-success-icon)",
                },
              ]}
            />
            <BlackLink
              to={`/milestones/${milestone.id}`}
              className="text-sm font-semibold text-content-base hover:text-link-hover transition-colors"
              underline="hover"
            >
              {milestone.name}
            </BlackLink>

            {/* Milestone indicators */}
            <div className="flex items-center gap-1 ml-1">
              {/* Description indicator */}
              {milestone.hasDescription && (
                <span className="text-content-dimmed">
                  <IconFileText size={12} />
                </span>
              )}

              {/* Comments indicator */}
              {milestone.hasComments && (
                <span className="text-content-dimmed flex items-center">
                  <IconMessageCircle size={12} />
                  {milestone.commentCount && (
                    <span className="ml-0.5 text-xs text-content-dimmed">
                      {milestone.commentCount}
                    </span>
                  )}
                </span>
              )}

              {/* Due date indicator */}
              {milestone.dueDate && (
                <span className="ml-1">
                  <DueDateDisplay dueDate={milestone.dueDate} />
                </span>
              )}
            </div>
          </div>
          <button
            className="text-content-dimmed hover:text-content-base"
            onClick={() => setIsTaskModalOpen(true)}
          >
            <IconPlus size={16} />
          </button>
        </div>

        {/* Tasks in this milestone - show empty state when no tasks */}
        {tasks && tasks.length > 0 ? (
          <TaskList 
            tasks={tasks} 
            milestoneId={milestone.id} 
          />
        ) : (
          <EmptyMilestoneDropZone 
            milestoneId={milestone.id}
            onTaskCreation={() => setIsTaskModalOpen(true)}
          />
        )}
      </li>
    
      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        milestones={availableMilestones.length > 0 ? availableMilestones : [milestone]}
        currentMilestoneId={milestone.id}
        people={availablePeople}
      />
    </>
  );
}

/**
 * Calculate statistics for a milestone based on its tasks
 */
export const calculateMilestoneStats = (tasks: Types.Task[]) => {
  const stats = {
    pending: 0,
    inProgress: 0,
    done: 0,
    canceled: 0,
    total: 0
  };

  // Skip empty task lists
  if (!tasks || tasks.length === 0) {
    return stats;
  }

  // Count tasks by status
  tasks.forEach(task => {
    // Don't count helper tasks
    if (task._isHelperTask) return;

    stats.total++;
    
    switch(task.status) {
      case "pending":
        stats.pending++;
        break;
      case "in_progress":
        stats.inProgress++;
        break;
      case "done":
        stats.done++;
        break;
      case "canceled":
        stats.canceled++;
        break;
    }
  });

  return stats;
}

/**
 * Calculate completion percentage for a milestone, excluding canceled tasks
 * If a milestone has 1 done task and 1 canceled task, it should show as 100% complete
 */
function calculateCompletionPercentage(stats: {
  pending: number;
  inProgress: number;
  done: number;
  canceled: number;
  total: number;
}) {
  // Active tasks are those that aren't canceled
  const activeTasks = stats.total - stats.canceled;
  
  // If there are no active tasks, show as 0% complete
  if (activeTasks === 0) return 0;
  
  // Calculate percentage based only on active tasks
  return (stats.done / activeTasks) * 100;
}

export default MilestoneCard;
