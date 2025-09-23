import { IconFileText, IconMessageCircle, IconPlus } from "../../icons";
import React, { useState } from "react";
import { DateField } from "../../DateField";
import { BlackLink } from "../../Link";
import { PieChart } from "../../PieChart";
import * as Types from "../types";
import { EmptyMilestoneDropZone } from "./EmptyMilestoneDropZone";
import TaskCreationModal from "./TaskCreationModal";
import { TaskList } from "./TaskList";
import { sortTasks } from "../utils/sortTasks";
import { InlineTaskCreator } from "./InlineTaskCreator";
import { useInlineTaskCreator } from "../hooks/useInlineTaskCreator";
import { SecondaryButton } from "../../Button";
import classNames from "../../utils/classnames";

export interface MilestoneCardProps {
  milestone: Types.Milestone;
  tasks: Types.Task[];
  hiddenTasks?: Types.Task[];
  showHiddenTasksToggle?: boolean;
  onTaskCreate: (task: Types.NewTaskPayload) => void;
  onTaskAssigneeChange: (taskId: string, assignee: Types.Person | null) => void;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskStatusChange: (taskId: string, status: string) => void;
  onMilestoneUpdate?: (milestoneId: string, updates: Types.UpdateMilestonePayload) => void;
  searchPeople?: (params: { query: string }) => Promise<Types.Person[]>;
  availableMilestones?: Types.Milestone[];
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
  hiddenTasks = [],
  showHiddenTasksToggle = false,
  onTaskCreate,
  onTaskAssigneeChange,
  onTaskDueDateChange,
  onTaskStatusChange,
  onMilestoneUpdate,
  searchPeople,
  stats,
  availableMilestones = [],
  availablePeople = [],
}: MilestoneCardProps) {
  const sortedTasks = React.useMemo(() => sortTasks(tasks, milestone), [tasks, milestone.tasksOrderingState]);

  // Generate default stats if not provided
  const milestoneStats = stats || calculateMilestoneStats(sortedTasks);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { open: creatorOpen, openCreator, closeCreator, creatorRef, hoverBind } = useInlineTaskCreator();

  const handleCreateTask = (newTask: Types.NewTaskPayload) => {
    if (onTaskCreate) {
      onTaskCreate(newTask);
    }
    // Close modal if not creating multiple tasks
    // (the modal handles this internally)
  };

  const handleMilestoneDueDateChange = (newDueDate: DateField.ContextualDate | null) => {
    if (onMilestoneUpdate) {
      onMilestoneUpdate(milestone.id, { name: milestone.name, dueDate: newDueDate || null });
    }
  };

  // Do not auto-open on empty milestones; rely on explicit triggers

  return (
    <>
      <li {...hoverBind}>
        {/* Milestone header */}
        <div
          className={classNames(
            "flex items-center justify-between gap-3 px-4 py-3 bg-surface-dimmed border-b border-surface-outline",
            !milestone.dueDate && onMilestoneUpdate ? "group/milestone-header" : undefined,
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Progress pie chart */}
            <PieChart
              size={16}
              slices={[
                {
                  percentage: calculateCompletionPercentage(milestoneStats),
                  color: "var(--color-callout-success-content)",
                },
              ]}
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BlackLink
                to={milestone.link || ""}
                className="truncate text-sm font-semibold text-content-base hover:text-link-hover transition-colors min-w-0"
                underline="hover"
                title={milestone.name}
              >
                <span className="truncate">{milestone.name}</span>
              </BlackLink>

              {/* Milestone indicators */}
              <div className="flex items-center gap-1 flex-shrink-0 text-content-dimmed">
                {milestone.hasDescription && (
                  <span className="flex items-center">
                    <IconFileText size={12} />
                  </span>
                )}

                {milestone.hasComments && (
                  <span className="flex items-center">
                    <IconMessageCircle size={12} />
                    {milestone.commentCount && (
                      <span className="ml-0.5 text-xs">{milestone.commentCount}</span>
                    )}
                  </span>
                )}
              </div>

              {/* Due date indicator */}
              <div className="group/milestone-due-date flex-shrink-0 flex items-center pl-1">
                {milestone.dueDate || !onMilestoneUpdate ? (
                  <DateField
                    date={milestone.dueDate || null}
                    onDateSelect={handleMilestoneDueDateChange}
                    variant="inline"
                    showOverdueWarning={true}
                    placeholder="Set due date"
                    readonly={!onMilestoneUpdate}
                    size="small"
                  />
                ) : (
                  <div className="opacity-0 transition-opacity group-hover/milestone-due-date:opacity-100 group-hover/milestone-header:opacity-100">
                    <DateField
                      date={null}
                      onDateSelect={handleMilestoneDueDateChange}
                      variant="inline"
                      showOverdueWarning={true}
                      placeholder="Set due date"
                      readonly={false}
                      size="small"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <SecondaryButton size="xs" icon={IconPlus} onClick={openCreator} testId="milestone-add-task">
            {/* icon-only for reduced repetition; keep accessible label */}
            <span className="sr-only">Add task</span>
          </SecondaryButton>
        </div>

        {/* Tasks in this milestone - show empty state when no tasks at all */}
        {(sortedTasks && sortedTasks.length > 0) || (hiddenTasks && hiddenTasks.length > 0) ? (
          <TaskList
            tasks={sortedTasks}
            hiddenTasks={hiddenTasks}
            showHiddenTasksToggle={showHiddenTasksToggle}
            milestoneId={milestone.id}
            onTaskAssigneeChange={onTaskAssigneeChange}
            onTaskDueDateChange={onTaskDueDateChange}
            onTaskStatusChange={onTaskStatusChange}
            searchPeople={searchPeople}
            inlineCreateRow={
              creatorOpen ? (
                <InlineTaskCreator
                  ref={creatorRef}
                  milestone={milestone}
                  onCreate={handleCreateTask}
                  onRequestAdvanced={() => setIsTaskModalOpen(true)}
                  onCancel={closeCreator}
                  autoFocus
                  testId="inline-task-creator"
                />
              ) : undefined
            }
          />
        ) : (
          <EmptyMilestoneDropZone milestoneId={milestone.id}>
            {creatorOpen ? (
              <>
                <InlineTaskCreator
                  ref={creatorRef}
                  milestone={milestone}
                  onCreate={handleCreateTask}
                  onRequestAdvanced={() => setIsTaskModalOpen(true)}
                  onCancel={closeCreator}
                  autoFocus
                  testId="inline-task-creator-empty"
                />
                <div className="px-4 pb-3 text-center text-content-subtle text-xs">
                  Press Enter to add. You can also drag tasks here.
                </div>
              </>
            ) : (
              <div className="text-center text-content-subtle text-sm">
                Click + or press 'c' to add a task, or drag a task here.
              </div>
            )}
          </EmptyMilestoneDropZone>
        )}
      </li>

      <TaskCreationModal
        searchPeople={searchPeople}
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
    total: 0,
  };

  // Skip empty task lists
  if (!tasks || tasks.length === 0) {
    return stats;
  }

  // Count tasks by status
  tasks.forEach((task) => {
    // Don't count helper tasks
    if (task._isHelperTask) return;

    stats.total++;

    switch (task.status) {
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
};

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
