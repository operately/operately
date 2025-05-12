import React, { useState } from "react";
import { StatusBadge } from "../../StatusBadge";
import { SecondaryButton } from "../../Button";
import { BlackLink } from "../../Link";
import { AvatarWithName } from "../../Avatar/AvatarWithName";
import {
  IconFileText,
  IconMessageCircle,
  IconCheck,
  IconCircleDashed,
  IconCircleDot,
  IconCircleCheckFilled,
  IconX,
  IconPlus,
  IconCalendar,
} from "@tabler/icons-react";
import { Menu, MenuActionItem } from "../../Menu";
import { PieChart } from "../../PieChart";

export namespace TaskBoard {
  export type Status = "pending" | "in_progress" | "done" | "canceled";

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl?: string;
  }

  export interface Milestone {
    id: string;
    name: string;
    dueDate?: Date;
    hasDescription?: boolean;
    hasComments?: boolean;
    commentCount?: number;
  }

  // Label interface removed in current iteration

  export interface Task {
    id: string;
    title: string;
    status: Status;
    description?: string;
    assignees?: Person[];
    // labels removed in current iteration
    milestone?: Milestone;
    points?: number;
    dueDate?: Date;
    hasComments?: boolean;
    hasDescription?: boolean;
    commentCount?: number;
  }

  export type TaskViewMode = "table" | "kanban" | "timeline";

  // Callback for when a task status changes
  export interface TaskBoardCallbacks {
    onStatusChange?: (taskId: string, newStatus: Status) => void;
  }

  export interface Props {
    title: string;
    tasks: Task[];
    viewMode?: TaskViewMode;
    onStatusChange?: (taskId: string, newStatus: Status) => void;
  }
}

// Helper to group tasks by status
const groupTasksByStatus = (tasks: TaskBoard.Task[]) => {
  const grouped: Record<string, TaskBoard.Task[]> = {
    pending: [],
    in_progress: [],
    done: [],
  };

  tasks.forEach((task) => {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    } else {
      grouped.pending.push(task);
    }
  });

  return grouped;
};

// Create colored icon components for each status
const ColoredIconCircleDot = (props: any) => <IconCircleDot {...props} className="text-brand-1" />;
const ColoredIconCircleCheckFilled = (props: any) => (
  <IconCircleCheckFilled {...props} className="text-callout-success-icon" />
);

// Map task status to badge status, labels and icons
const taskStatusConfig: Record<TaskBoard.Status, { status: string; label: string; icon: any; color?: string }> = {
  pending: { status: "not_started", label: "Not started", icon: IconCircleDashed },
  in_progress: { status: "in_progress", label: "In progress", icon: ColoredIconCircleDot, color: "text-brand-1" },
  done: { status: "completed", label: "Done", icon: ColoredIconCircleCheckFilled, color: "text-callout-success-icon" },
  canceled: { status: "canceled", label: "Canceled", icon: IconX },
};

// Helper to get the display name for a status
const getStatusDisplayName = (status: TaskBoard.Status): string => {
  switch (status) {
    case "pending":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "done":
      return "Done";
    default:
      return status;
  }
};

// Status selector component with dropdown menu
function StatusSelector({
  task,
  onStatusChange,
  showFullBadge = false,
}: {
  task: TaskBoard.Task;
  onStatusChange?: (newStatus: TaskBoard.Status) => void;
  showFullBadge?: boolean;
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter status options based on search term
  const filteredStatusOptions = Object.entries(taskStatusConfig).filter(([_, config]) =>
    config.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle menu open/close events
  const handleMenuOpenChange = (open: boolean) => {
    if (open) {
      // Focus input when menu opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    } else {
      // Reset search term when menu closes
      setSearchTerm("");
    }
  };

  // Handle enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredStatusOptions.length > 0) {
      const [firstMatchStatus] = filteredStatusOptions[0];
      onStatusChange && onStatusChange(firstMatchStatus as TaskBoard.Status);
    }
  };

  // Custom search input for the menu header
  const searchInput = (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Change status..."
        className="w-full bg-surface-base text-content-base text-sm py-1 px-2 border border-surface-outline rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          // Prevent menu from closing when typing
          e.stopPropagation();
          handleKeyDown(e);
        }}
        onClick={(e) => e.stopPropagation()} // Prevent menu from closing when clicking in the input
      />
      <span className="absolute right-2 top-1.5 text-content-subtle">
        <div className="text-[10px] font-mono">⏎</div>
      </span>
    </div>
  );

  return (
    <Menu
      customTrigger={
        <div className="cursor-pointer inline-flex items-center">
          {showFullBadge ? (
            <StatusBadge
              status={taskStatusConfig[task.status].status}
              customLabel={taskStatusConfig[task.status].label}
            />
          ) : (
            <div className="inline-flex items-center justify-center w-4 h-4">
              {React.createElement(taskStatusConfig[task.status].icon, {
                size: 16,
                className: `align-middle ${taskStatusConfig[task.status].color || ""}`,
              })}
            </div>
          )}
        </div>
      }
      size="small"
      headerContent={searchInput}
      onOpenChange={handleMenuOpenChange}
    >
      {filteredStatusOptions.map(([status, config]) => {
        const isCurrentStatus = status === task.status;
        return (
          <MenuActionItem
            key={status}
            icon={config.icon}
            onClick={() => onStatusChange && onStatusChange(status as TaskBoard.Status)}
          >
            <div className="flex items-center justify-between w-full">
              {config.label}
              {isCurrentStatus && <IconCheck size={14} className="text-primary-500 ml-2" />}
            </div>
          </MenuActionItem>
        );
      })}
    </Menu>
  );
}

// Helper component to display due date with appropriate formatting
function DueDateDisplay({ dueDate }: { dueDate: Date }) {
  const isOverdue = dueDate < new Date();
  const formattedDate = dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (isOverdue) {
    return (
      <span className="text-content-error flex items-center gap-1 text-xs">
        <IconCalendar size={12} />
        {formattedDate}
      </span>
    );
  }

  return (
    <span className="text-content-dimmed flex items-center gap-1 text-xs">
      <IconCalendar size={12} />
      {formattedDate}
    </span>
  );
}

export function TaskBoard({
  tasks: initialTasks,
  title = "Tasks",
  viewMode = "table",
  onStatusChange,
}: {
  tasks: TaskBoard.Task[];
  title?: string;
  viewMode?: TaskBoard.TaskViewMode;
  onStatusChange?: (taskId: string, newStatus: TaskBoard.Status) => void;
}) {
  const [currentViewMode, setCurrentViewMode] = useState<TaskBoard.TaskViewMode>(viewMode);
  const [tasks, setTasks] = useState<TaskBoard.Task[]>(initialTasks);

  // Group tasks by milestone
  const groupTasksByMilestone = (tasks: TaskBoard.Task[]) => {
    const grouped: Record<string, TaskBoard.Task[]> = {};

    // Group with no milestone
    grouped["no_milestone"] = [];

    // First create all milestone groups
    tasks.forEach((task) => {
      if (task.milestone) {
        const milestoneId = task.milestone.id;
        if (!grouped[milestoneId]) {
          grouped[milestoneId] = [];
        }
      }
    });

    // Then add tasks to appropriate groups
    tasks.forEach((task) => {
      if (task.milestone) {
        const milestoneId = task.milestone.id;
        grouped[milestoneId].push(task);
      } else {
        grouped["no_milestone"].push(task);
      }
    });

    return grouped;
  };

  // Get all unique milestones from tasks with completion statistics
  const getMilestones = () => {
    const milestoneMap = new Map<
      string,
      {
        milestone: TaskBoard.Milestone;
        stats: { pending: number; inProgress: number; done: number; canceled: number; total: number };
      }
    >();

    tasks.forEach((task) => {
      if (task.milestone) {
        const milestoneId = task.milestone.id;

        if (!milestoneMap.has(milestoneId)) {
          milestoneMap.set(milestoneId, {
            milestone: task.milestone,
            stats: { pending: 0, inProgress: 0, done: 0, canceled: 0, total: 0 },
          });
        }

        // Update statistics
        const stats = milestoneMap.get(milestoneId)!.stats;
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
      }
    });

    return Array.from(milestoneMap.values());
  };

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: TaskBoard.Status) => {
    // Update local state
    const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
    setTasks(updatedTasks);

    // Notify parent component if callback is provided
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  // Group tasks by milestone
  const groupedTasks = groupTasksByMilestone(tasks);
  const milestones = getMilestones();

  return (
    <div className="flex flex-col w-full h-full bg-surface-base rounded-lg">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2 border-b border-surface-outline">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-sm sm:text-base font-bold text-content-accent">{title}</h1>
          <SecondaryButton size="xs">+ Add Task</SecondaryButton>
        </div>
        <div className="flex mt-2 sm:mt-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentViewMode("table")}
              className={`px-3 py-1 text-xs rounded-md ${
                currentViewMode === "table"
                  ? "bg-primary-base text-white"
                  : "bg-surface-accent text-content-base hover:bg-surface-accent-hover"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setCurrentViewMode("kanban")}
              className={`px-3 py-1 text-xs rounded-md ${
                currentViewMode === "kanban"
                  ? "bg-primary-base text-white"
                  : "bg-surface-accent text-content-base hover:bg-surface-accent-hover"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setCurrentViewMode("timeline")}
              className={`px-3 py-1 text-xs rounded-md ${
                currentViewMode === "timeline"
                  ? "bg-primary-base text-white"
                  : "bg-surface-accent text-content-base hover:bg-surface-accent-hover"
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        {currentViewMode === "table" && (
          <div className="overflow-x-auto bg-surface-base">
            <ul className="w-full">
              {/* If no tasks at all */}
              {tasks.length === 0 && <li className="py-4 text-center text-content-subtle">No tasks found</li>}

              {/* Tasks with milestones */}
              {milestones.map((milestoneData) => (
                <li key={milestoneData.milestone.id}>
                  {/* Milestone header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-dimmed border-b border-surface-outline">
                    <div className="flex items-center gap-2">
                      {/* Progress pie chart */}
                      <PieChart
                        size={16}
                        slices={[
                          {
                            percentage: (milestoneData.stats.done / milestoneData.stats.total) * 100,
                            color: "var(--color-callout-success-icon)",
                          },
                        ]}
                      />
                      <BlackLink
                        to={`/milestones/${milestoneData.milestone.id}`}
                        className="text-sm font-semibold text-content-base hover:text-link-hover transition-colors"
                        underline="hover"
                      >
                        {milestoneData.milestone.name}
                      </BlackLink>
                      {/* <span className="text-xs text-content-dimmed">
                        {milestoneData.stats.done}/{milestoneData.stats.total} completed
                      </span> */}

                      {/* Milestone indicators */}
                      <div className="flex items-center gap-1 ml-1">
                        {/* Description indicator */}
                        {milestoneData.milestone.hasDescription && (
                          <span className="text-content-subtle">
                            <IconFileText size={12} />
                          </span>
                        )}

                        {/* Comments indicator */}
                        {milestoneData.milestone.hasComments && (
                          <span className="text-content-subtle flex items-center">
                            <IconMessageCircle size={12} />
                            {milestoneData.milestone.commentCount && (
                              <span className="ml-0.5 text-xs text-content-subtle">
                                {milestoneData.milestone.commentCount}
                              </span>
                            )}
                          </span>
                        )}

                        {/* Due date indicator */}
                        {milestoneData.milestone.dueDate && (
                          <span className="ml-1">
                            <DueDateDisplay dueDate={milestoneData.milestone.dueDate} />
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="text-content-dimmed hover:text-content-base">
                      <IconPlus size={16} />
                    </button>
                  </div>

                  {/* Tasks in this milestone */}
                  <ul>
                    {groupedTasks[milestoneData.milestone.id].map((task) => (
                      <li key={task.id} className="group flex bg-surface-base hover:bg-surface-highlight px-4 py-2.5">
                        <div className="flex-1 flex items-center gap-2">
                          {/* Status icon */}
                          <div className="flex-shrink-0 flex items-center">
                            <StatusSelector
                              task={task}
                              onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                            />
                          </div>

                          {/* Task title */}
                          <BlackLink
                            to={`/tasks/${task.id}`}
                            className="text-sm text-content-base hover:text-link-hover transition-colors"
                            underline="hover"
                          >
                            {task.title}
                          </BlackLink>

                          {/* Description indicator */}
                          {task.hasDescription && (
                            <span className="-ml-1 text-content-subtle">
                              <IconFileText size={14} />
                            </span>
                          )}

                          {/* Comments indicator */}
                          {task.hasComments && (
                            <span className="-ml-1 text-content-subtle flex items-center">
                              <IconMessageCircle size={14} />
                              {task.commentCount && (
                                <span className="ml-0.5 text-xs text-content-subtle">{task.commentCount}</span>
                              )}
                            </span>
                          )}

                          {/* Due date */}
                          {task.dueDate && (
                            <span className="ml-2">
                              <DueDateDisplay dueDate={task.dueDate} />
                            </span>
                          )}

                          {/* Assignee */}
                          {task.assignees && task.assignees.length > 0 && (
                            <span className="ml-2">
                              <AvatarWithName
                                person={task.assignees[0]}
                                size="tiny"
                                nameFormat="short"
                                className="text-xs text-content-dimmed"
                              />
                            </span>
                          )}
                        </div>
                      </li>
                    ))}

                    {groupedTasks[milestoneData.milestone.id].length === 0 && (
                      <li className="py-2 px-4 text-xs text-content-subtle">No tasks in this milestone</li>
                    )}
                  </ul>
                </li>
              ))}

              {/* Tasks with no milestone */}
              {groupedTasks["no_milestone"].length > 0 && (
                <li>
                  {/* No milestone header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-surface-dimmed border-b border-surface-outline">
                    <div className="flex items-center gap-2">
                      {/* No progress pie chart for tasks without milestone */}
                      <span className="text-sm font-semibold text-content-base">No milestone</span>
                      {/* No indicators for 'No milestone' header */}
                    </div>
                    <button className="text-content-subtle hover:text-content-base">
                      <IconPlus size={16} />
                    </button>
                  </div>

                  {/* Tasks with no milestone */}
                  <ul>
                    {groupedTasks["no_milestone"].map((task) => (
                      <li
                        key={task.id}
                        className="group flex border-b border-stroke-base bg-surface-base hover:bg-surface-highlight px-4 py-1.5"
                      >
                        <div className="flex-1 flex items-center gap-2">
                          {/* Status icon */}
                          <div className="flex-shrink-0 flex items-center">
                            <StatusSelector
                              task={task}
                              onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                            />
                          </div>

                          {/* Task title */}
                          <BlackLink
                            to={`/tasks/${task.id}`}
                            className="text-sm text-content-base hover:text-link-hover transition-colors"
                            underline="hover"
                          >
                            {task.title}
                          </BlackLink>

                          {/* Description indicator */}
                          {task.hasDescription && (
                            <span className="ml-2 text-content-dimmed">
                              <IconFileText size={14} />
                            </span>
                          )}

                          {/* Comments indicator */}
                          {task.hasComments && (
                            <span className="ml-2 text-content-dimmed flex items-center">
                              <IconMessageCircle size={14} />
                              {task.commentCount && (
                                <span className="ml-1 text-xs text-content-dimmed">{task.commentCount}</span>
                              )}
                            </span>
                          )}

                          {/* Due date */}
                          {task.dueDate && (
                            <span className="ml-2">
                              <DueDateDisplay dueDate={task.dueDate} />
                            </span>
                          )}

                          {/* Assignee */}
                          {task.assignees && task.assignees.length > 0 && (
                            <span className="ml-2">
                              <AvatarWithName
                                person={task.assignees[0]}
                                size="tiny"
                                nameFormat="short"
                                className="text-xs"
                              />
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        )}
        {currentViewMode === "kanban" && (
          <div className="flex h-full text-center text-content-subtle">
            <div className="m-auto p-6 border border-dashed border-surface-outline rounded-lg">
              Kanban view will be implemented here
            </div>
          </div>
        )}
        {currentViewMode === "timeline" && (
          <div className="flex h-full text-center text-content-subtle">
            <div className="m-auto p-6 border border-dashed border-surface-outline rounded-lg">
              Timeline view will be implemented here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskBoard;
