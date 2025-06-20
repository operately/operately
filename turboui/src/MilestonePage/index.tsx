import React, { useState } from "react";
import { Page } from "../Page";
import { PieChart } from "../PieChart";
import { calculateMilestoneStats } from "../TaskBoard/components/MilestoneCard";
import TaskCreationModal from "../TaskBoard/components/TaskCreationModal";
import { TaskList } from "../TaskBoard/components/TaskList";
import { reorderTasksInList } from "../TaskBoard/utils/taskReorderingUtils";
import { DragAndDropProvider } from "../utils/DragAndDrop";

// Calculate completion percentage for a milestone, excluding canceled tasks
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
// Using DateField instead of DueDateDisplay
import { IconMessageCircle, IconPlus } from "../icons";
import { GhostButton } from "../Button";
import { DateField } from "../DateField";
import * as Types from "../TaskBoard/types";

interface MilestonePageProps {
  // Milestone to display
  milestone: Types.Milestone;

  // Tasks for this milestone
  tasks: Types.Task[];

  // Space and project context for breadcrumbs
  spaceName: string;
  spaceUrl: string;
  projectName: string;
  projectUrl: string;

  // Optional callbacks
  onStatusChange?: (taskId: string, newStatus: Types.Status) => void;
  onTaskCreate?: (task: Omit<Types.Task, "id">) => void;
  onTaskReorder?: (tasks: Types.Task[]) => void;
  onCommentCreate?: (comment: string) => void;
  onDueDateChange?: (milestoneId: string, dueDate: Date | null) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Types.Task>) => void;
  searchPeople?: (params: { query: string }) => Promise<Types.Person[]>;
}

export function MilestonePage({
  milestone,
  tasks,
  spaceName,
  spaceUrl,
  projectName,
  projectUrl,
  onTaskCreate,
  onTaskReorder,
  onDueDateChange,
  onTaskUpdate,
  searchPeople,
}: MilestonePageProps) {
  // State
  const [showCompleted, setShowCompleted] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Calculate stats
  const stats = calculateMilestoneStats(tasks);
  const completionPercentage = calculateCompletionPercentage(stats);

  // Filter tasks based on showCompleted state
  const filteredTasks = tasks.filter((task) => {
    if (showCompleted) {
      return true; // Show all tasks
    } else {
      // Only show pending and in-progress tasks
      return task.status === "pending" || task.status === "in_progress";
    }
  });

  // Count of completed tasks for the "show completed" link
  const completedCount = stats.done;

  // Navigation for breadcrumbs
  const navigation = [
    { to: spaceUrl, label: spaceName },
    { to: projectUrl, label: projectName },
  ];

  // Handle task creation
  const handleCreateTask = (newTask: Omit<Types.Task, "id">) => {
    if (onTaskCreate) {
      // Add the milestone to the task
      onTaskCreate({
        ...newTask,
        milestone: milestone,
      });
    }
    setIsTaskModalOpen(false);
  };

  return (
    <Page
      title={milestone.name}
      size="large"
      navigation={navigation}
      options={[
        {
          type: "action",
          icon: IconPlus,
          label: "Add Task",
          onClick: () => setIsTaskModalOpen(true),
        },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        {/* Header section with milestone info */}
        <div className="flex items-center justify-between px-4 mt-4">
          <div className="flex items-center gap-4">
            {/* Progress pie chart */}
            <div className="h-12 w-12">
              <PieChart
                size={48}
                slices={[
                  {
                    percentage: completionPercentage,
                    color: "var(--color-callout-success-icon)",
                  },
                ]}
              />
            </div>

            {/* Milestone title */}
            <h1 className="text-2xl font-bold">{milestone.name}</h1>

            {/* Due date or Set target date affordance */}
            <div className="ml-4 flex items-center text-content-subtle">
              <DateField
                date={milestone.dueDate || null}
                setDate={(date) => {
                  if (onDueDateChange) {
                    // Handle both setting a date and clearing a date (null)
                    onDueDateChange(milestone.id, date);
                  }
                }}
                placeholder="Set target date"
                readonly={!!onDueDateChange}
                showOverdueWarning
                showEmptyStateAsButton
              />
            </div>
          </div>
        </div>

        {/* Description section */}
        {milestone.hasDescription && (
          <div className="p-6 bg-surface-dimmed rounded-md">
            <div className="prose max-w-none pl-7">
              {/* This would be a rich text renderer component in a real app */}
              <p className="text-content-subtle">Milestone description would go here, rendered as rich text.</p>
            </div>
          </div>
        )}

        {/* Tasks section */}
        <div>
          <div className="flex items-center justify-between mb-4 px-4">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <GhostButton size="xs" icon={IconPlus} onClick={() => setIsTaskModalOpen(true)}>
              Add Task
            </GhostButton>
          </div>

          {/* Task list */}
          <div className="rounded-md border border-surface-outline overflow-hidden">
            <DragAndDropProvider
              onDrop={(_, draggedId, index) => {
                if (onTaskReorder) {
                  onTaskReorder(reorderTasksInList(filteredTasks, draggedId, index));
                  return true;
                }
                return false;
              }}
            >
              <div className="px-8">
                <TaskList
                  tasks={filteredTasks}
                  milestoneId={milestone.id}
                  onTaskUpdate={onTaskUpdate}
                  searchPeople={searchPeople}
                />
              </div>
            </DragAndDropProvider>

            {/* Show completed link */}
            {!showCompleted && completedCount > 0 && (
              <div className="p-2 text-center border-t border-surface-outline">
                <button onClick={() => setShowCompleted(true)} className="text-sm text-brand-1 hover:underline">
                  Show {completedCount} completed {completedCount === 1 ? "task" : "tasks"}
                </button>
              </div>
            )}

            {/* Hide completed link */}
            {showCompleted && completedCount > 0 && (
              <div className="p-4 text-center border-t border-surface-outline">
                <button onClick={() => setShowCompleted(false)} className="text-sm text-brand-1 hover:underline">
                  Hide completed tasks
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments section placeholder */}
        {milestone.hasComments && (
          <div className="p-6 bg-surface-dimmed rounded-md">
            <div className="flex items-center mb-3">
              <IconMessageCircle className="mr-2 w-5 h-5 text-content-subtle" />
              <h2 className="text-lg font-semibold">
                Comments {milestone.commentCount && `(${milestone.commentCount})`}
              </h2>
            </div>
            <div className="pl-7">
              <p className="text-content-subtle">Comments would go here in a real implementation.</p>
            </div>
          </div>
        )}
      </div>

      {/* Task creation modal */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        currentMilestoneId={milestone.id}
        milestones={[milestone]}
      />
    </Page>
  );
}

export default MilestonePage;
