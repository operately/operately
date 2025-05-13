import React, { useState, useMemo, useCallback, useEffect } from "react";
import { StatusBadge } from "../../StatusBadge";
import { SecondaryButton } from "../../Button";
import { BlackLink } from "../../Link";
import { DragAndDropProvider, useDraggable, useDraggingAnimation, useDropZone } from "../../utils/DragAndDrop";
import classNames from "../../utils/classnames";
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
  IconGripVertical,
} from "@tabler/icons-react";
import { Menu, MenuActionItem } from "../../Menu";
import { PieChart } from "../../PieChart";
import TaskCreationModal from "./TaskCreationModal";
import MilestoneCreationModal from "./MilestoneCreationModal";

export namespace TaskBoard {
  export type Status = "pending" | "in_progress" | "done" | "canceled";

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl?: string;
  }

  // Interface for tasks with drag-and-drop position index

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
    hasDescription?: boolean;
    hasComments?: boolean;
    commentCount?: number;
    comments?: any[];
    // Special flag to hide helper tasks used for empty milestones
    _isHelperTask?: boolean;
  }

  export interface TaskWithIndex extends Task {
    index: number;
  }

  export type ViewMode = "table" | "kanban" | "timeline";

  // Callback for when a task status changes
  export interface TaskBoardCallbacks {
    onStatusChange?: (taskId: string, newStatus: Status) => void;
  }

  export interface Props {
    title: string;
    tasks: Task[];
    viewMode?: ViewMode;
    onStatusChange?: (taskId: string, newStatus: Status) => void;
    onTaskCreate?: (task: Omit<Task, "id">) => void;
    onMilestoneCreate?: (milestone: Omit<Milestone, "id">) => void;
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

  return (
    <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-content-dimmed"}`}>
      <IconCalendar size={14} />
      <span>{formattedDate}</span>
    </span>
  );
}

// TaskList component with drag and drop functionality
function TaskList({ tasks, milestoneId }: { tasks: TaskBoard.Task[]; milestoneId: string }) {
  // Add drag and drop index to each task
  const tasksWithIndex = useMemo(() => {
    return tasks.map((task, index) => ({ ...task, index }));
  }, [tasks]);

  // Set up drop zone for this list of tasks
  const { ref } = useDropZone({ id: `milestone-${milestoneId}`, dependencies: [tasksWithIndex] });
  const { containerStyle, itemStyle } = useDraggingAnimation(`milestone-${milestoneId}`, tasksWithIndex);

  return (
    <ul ref={ref as React.RefObject<HTMLUListElement>} style={containerStyle}>
      {tasksWithIndex.map((task) => (
        <TaskItem
          key={task.id}
          task={task as TaskBoard.TaskWithIndex}
          milestoneId={milestoneId}
          itemStyle={itemStyle}
        />
      ))}
    </ul>
  );
}

// Empty milestone drop zone component that allows dropping tasks into empty milestones
function EmptyMilestoneDropZone({ milestoneId }: { milestoneId: string }) {
  // Set up drop zone with the same ID pattern as TaskList
  const { ref } = useDropZone({ id: `milestone-${milestoneId}`, dependencies: [] });
  
  return (
    <div 
      ref={ref as React.RefObject<HTMLDivElement>}
      className="py-3 px-4 text-center text-content-subtle text-sm min-h-[40px]"
    >
      No tasks in this milestone. Click + to add a task or drag a task here.
    </div>
  );
}

// Individual task item component that can be dragged
function TaskItem({
  task,
  milestoneId,
  itemStyle,
}: {
  task: TaskBoard.TaskWithIndex;
  milestoneId: string;
  itemStyle: (id: string) => React.CSSProperties;
}) {
  // Set up draggable behavior
  const { ref, isDragging } = useDraggable({ id: task.id, zoneId: `milestone-${milestoneId}` });

  const itemClasses = classNames(isDragging ? "opacity-50 bg-surface-accent" : "");

  return (
    <li ref={ref as React.RefObject<HTMLLIElement>} style={itemStyle(task.id)} className={itemClasses}>
      <div className="flex items-center px-4 py-2.5 group bg-surface-base hover:bg-surface-highlight">
        <div className="flex-1 flex items-center gap-2">
          {/* Status icon */}
          <div className="flex-shrink-0 flex items-center">
            <StatusSelector
              task={task}
              onStatusChange={(newStatus) => {
                // This will bubble up to the main component's handleStatusChange
                if (task.id) {
                  // We need to pass both task ID and the new status up to the parent
                  const changeEvent = new CustomEvent("statusChange", {
                    detail: { taskId: task.id, newStatus },
                  });
                  document.dispatchEvent(changeEvent);
                }
              }}
            />
          </div>

          {/* Task title with all meta indicators */}
          <div className="md:truncate flex-1 flex items-center gap-2">
            <BlackLink
              to={`/tasks/${task.id}`}
              className="text-sm hover:text-link-hover transition-colors"
              underline="hover"
            >
              {task.title}
            </BlackLink>

            {/* Description indicator */}
            {task.hasDescription && (
              <span className="text-content-subtle flex-shrink-0">
                <IconFileText size={14} />
              </span>
            )}

            {/* Comments indicator */}
            {task.hasComments && (
              <span className="text-content-subtle flex items-center flex-shrink-0">
                <IconMessageCircle size={14} />
                {task.commentCount && <span className="ml-0.5 text-xs text-content-subtle">{task.commentCount}</span>}
              </span>
            )}

            {/* Due date */}
            {task.dueDate && (
              <span className="text-xs text-content-subtle flex items-center flex-shrink-0">
                <DueDateDisplay dueDate={task.dueDate} />
              </span>
            )}

            {/* Assignee */}
            {task.assignees && task.assignees.length > 0 && (
              <span className="flex-shrink-0">
                <AvatarWithName
                  person={task.assignees[0]}
                  size="tiny"
                  nameFormat="short"
                  className="text-xs text-content-dimmed"
                />
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function TaskBoard({
  tasks: externalTasks,
  title = "Tasks",
  viewMode = "table",
  onStatusChange,
  onTaskCreate,
  onMilestoneCreate,
}: {
  tasks: TaskBoard.Task[];
  title?: string;
  viewMode?: TaskBoard.ViewMode;
  onStatusChange?: (taskId: string, newStatus: TaskBoard.Status) => void;
  onTaskCreate?: (task: Omit<TaskBoard.Task, "id">) => void;
  onMilestoneCreate?: (milestone: Omit<TaskBoard.Milestone, "id">) => void;
}) {
  const [currentViewMode, setCurrentViewMode] = useState<TaskBoard.ViewMode>(viewMode);
  const [internalTasks, setInternalTasks] = useState<TaskBoard.Task[]>(externalTasks);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [activeTaskMilestoneId, setActiveTaskMilestoneId] = useState<string | undefined>();

  // Keep internal tasks in sync with external tasks
  useEffect(() => {
    setInternalTasks(externalTasks);
  }, [externalTasks]);

  // Group tasks by milestone, filtering out helper tasks
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

    // Then add tasks to appropriate groups, filtering out helper tasks
    tasks.forEach((task) => {
      // Skip helper tasks used for empty milestones
      if (task._isHelperTask) {
        return;
      }

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
        hasTasks: boolean;
      }
    >();

    // Build the map of all milestones from tasks
    internalTasks.forEach((task) => {
      if (task.milestone) {
        const milestoneId = task.milestone.id;

        if (!milestoneMap.has(milestoneId)) {
          milestoneMap.set(milestoneId, {
            milestone: task.milestone,
            stats: { pending: 0, inProgress: 0, done: 0, canceled: 0, total: 0 },
            hasTasks: false, // Initialize as false, we'll set to true only if non-helper tasks exist
          });
        }

        // Don't count helper tasks toward milestone statistics
        if (!task._isHelperTask) {
          // Only set hasTasks to true if there's at least one real (non-helper) task
          milestoneMap.get(milestoneId)!.hasTasks = true;

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
      }
    });

    // Return milestones sorted by ID to maintain consistent ordering
    return Array.from(milestoneMap.values())
      .sort((a, b) => a.milestone.id.localeCompare(b.milestone.id));
  };

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: TaskBoard.Status) => {
    // Update local state
    const updatedTasks = internalTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
    setInternalTasks(updatedTasks);

    // Notify parent component if callback is provided
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  // Set up event listener for status changes from TaskItems
  useEffect(() => {
    const handleStatusChangeEvent = (e: Event) => {
      const { taskId, newStatus } = (e as CustomEvent).detail;
      handleStatusChange(taskId, newStatus);
    };

    document.addEventListener("statusChange", handleStatusChangeEvent);

    return () => {
      document.removeEventListener("statusChange", handleStatusChangeEvent);
    };
  }, [handleStatusChange]);

  // Handle creating a new task
  const handleCreateTask = (newTaskData: Omit<TaskBoard.Task, "id">) => {
    if (onTaskCreate) {
      // Log to confirm task creation event is being triggered
      console.log("TaskBoard: Creating new task", newTaskData);
      onTaskCreate(newTaskData);
    } else {
      console.warn("TaskBoard: onTaskCreate handler is not provided");
    }
  };

  // Handle creating a new milestone
  const handleCreateMilestone = (newMilestoneData: Omit<TaskBoard.Milestone, "id">) => {
    if (onMilestoneCreate) {
      // Log to confirm milestone creation event is being triggered
      console.log("TaskBoard: Creating new milestone", newMilestoneData);
      onMilestoneCreate(newMilestoneData);
    } else {
      console.warn("TaskBoard: onMilestoneCreate handler is not provided");
    }
  };

  // Group tasks by milestone and get milestone stats
  const groupedTasks = groupTasksByMilestone(internalTasks);
  const milestones = getMilestones();

  // Handle task reordering via drag and drop
  const handleTaskReorder = useCallback(
    (dropZoneId: string, draggedId: string, indexInDropZone: number) => {
      // Extract milestone ID from the dropZoneId (format: milestone-{id})
      const targetMilestoneId = dropZoneId.replace("milestone-", "");

      // Find the task being dragged
      const draggedTask = internalTasks.find((task) => task.id === draggedId);
      if (!draggedTask) return;

      // Remember the original milestone ID before drag (for later checking if it's now empty)
      const originalMilestoneId = draggedTask.milestone?.id;

      // Create a new array of tasks with the dragged task moved to the new position
      const updatedTasks = [...internalTasks];

      // First remove the task from its current position
      const taskIndex = updatedTasks.findIndex((task) => task.id === draggedId);
      if (taskIndex > -1) {
        updatedTasks.splice(taskIndex, 1);
      }

      // Group tasks by milestone to find the insertion point
      const tasksByMilestone = groupTasksByMilestone(updatedTasks);

      // Determine the real target array and index
      const targetArray =
        targetMilestoneId === "no-milestone"
          ? tasksByMilestone["no_milestone"]
          : tasksByMilestone[targetMilestoneId] || [];

      // If the task's milestone has changed, update it
      if (targetMilestoneId === "no-milestone") {
        draggedTask.milestone = undefined;
      } else if (targetMilestoneId !== draggedTask.milestone?.id) {
        // Find the milestone object from an existing task with this milestone ID
        const targetMilestone = milestones.find((m) => m.milestone.id === targetMilestoneId)?.milestone;
        if (targetMilestone) {
          draggedTask.milestone = targetMilestone;
        }
      }

      // Insert the task at the new position
      // Ensure the index is valid
      const insertIndex = Math.min(indexInDropZone, targetArray.length);

      // If the target is the no_milestone group, insert directly into the updatedTasks array
      if (targetMilestoneId === "no-milestone") {
        // Count how many tasks are before this in the overall array
        let globalIndex = 0;

        // Count tasks from other milestones that come before this one in the list
        for (const milestoneId in tasksByMilestone) {
          if (milestoneId === "no_milestone") break;
          globalIndex += tasksByMilestone[milestoneId].length;
        }

        // Add the insertion index within the no_milestone group
        globalIndex += insertIndex;

        // Insert the task at the calculated global index
        updatedTasks.splice(globalIndex, 0, draggedTask);
      } else {
        // Find where in the overall tasks array this milestone's tasks start
        let globalIndex = 0;

        // Count tasks from milestones that come before this one
        for (const milestoneId in tasksByMilestone) {
          if (milestoneId === targetMilestoneId) break;
          globalIndex += tasksByMilestone[milestoneId].length;
        }

        // Add the insertion index within the milestone
        globalIndex += insertIndex;

        // Insert the task at the calculated global index
        updatedTasks.splice(globalIndex, 0, draggedTask);
      }

      // Check if the original milestone is now empty and needs a helper task
      if (originalMilestoneId && originalMilestoneId !== targetMilestoneId) {
        // Check if there are any non-helper tasks remaining in the milestone
        const hasRealTasks = updatedTasks.some(
          (task) => !task._isHelperTask && task.milestone?.id === originalMilestoneId,
        );

        // If no real tasks remain and this milestone doesn't already have a helper task
        if (
          !hasRealTasks &&
          !updatedTasks.some((task) => task._isHelperTask && task.milestone?.id === originalMilestoneId)
        ) {
          // Find the original milestone object
          const originalMilestone = milestones.find((m) => m.milestone.id === originalMilestoneId)?.milestone;

          if (originalMilestone) {
            // Create a helper task to keep the empty milestone visible
            const helperTask: TaskBoard.Task = {
              id: `task-helper-${originalMilestoneId}-${Date.now()}`,
              title: `Helper task for ${originalMilestone.name}`,
              status: "pending",
              milestone: originalMilestone,
              _isHelperTask: true,
            };

            // Add the helper task to the updated tasks
            updatedTasks.push(helperTask);
          }
        }
      }

      // Update state with the reordered tasks
      setInternalTasks(updatedTasks);

      console.log(`Reordered: Task ${draggedId} moved to ${targetMilestoneId} at position ${indexInDropZone}`);
    },
    [internalTasks, milestones, setInternalTasks],
  );

  return (
    <div className="flex flex-col w-full h-full bg-surface-base rounded-lg">
      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        milestones={milestones.map((m) => m.milestone)}
        currentMilestoneId={activeTaskMilestoneId}
        people={internalTasks
          .flatMap((task) => task.assignees || [])
          .filter((person, index, self) => index === self.findIndex((p) => p.id === person.id))}
      />

      {/* Milestone Creation Modal */}
      <MilestoneCreationModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onCreateMilestone={handleCreateMilestone}
      />

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2 border-b border-surface-outline">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-sm sm:text-base font-bold text-content-accent">{title}</h1>
          <SecondaryButton
            size="xxs"
            onClick={() => {
              setActiveTaskMilestoneId(undefined);
              setIsTaskModalOpen(true);
            }}
          >
            + Add Task
          </SecondaryButton>
          <SecondaryButton
            size="xxs"
            onClick={() => {
              setIsMilestoneModalOpen(true);
            }}
          >
            + Add Milestone
          </SecondaryButton>
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
          <DragAndDropProvider onDrop={handleTaskReorder}>
            <div className="overflow-x-auto bg-surface-base">
              <ul className="w-full">
                {/* If no tasks at all */}
                {internalTasks.length === 0 && <li className="py-4 text-center text-content-subtle">No tasks found</li>}

                {/* Tasks with milestones */}
                {milestones.map((milestoneData) => (
                  <li key={milestoneData.milestone.id}>
                    {/* Milestone header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-dimmed border-b border-surface-outline first:border-t-0">
                      <div className="flex items-center gap-2">
                        {/* Progress pie chart - handle empty milestone case */}
                        <PieChart
                          size={16}
                          slices={[
                            {
                              percentage:
                                milestoneData.stats.total > 0
                                  ? (milestoneData.stats.done / milestoneData.stats.total) * 100
                                  : 0,
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
                            <span className="text-content-dimmed">
                              <IconFileText size={12} />
                            </span>
                          )}

                          {/* Comments indicator */}
                          {milestoneData.milestone.hasComments && (
                            <span className="text-content-dimmed flex items-center">
                              <IconMessageCircle size={12} />
                              {milestoneData.milestone.commentCount && (
                                <span className="ml-0.5 text-xs text-content-dimmed">
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
                      <button
                        className="text-content-dimmed hover:text-content-base"
                        onClick={() => {
                          setActiveTaskMilestoneId(milestoneData.milestone.id);
                          setIsTaskModalOpen(true);
                        }}
                      >
                        <IconPlus size={16} />
                      </button>
                    </div>

                    {/* Tasks in this milestone - show empty state when no tasks */}
                    {groupedTasks[milestoneData.milestone.id] && groupedTasks[milestoneData.milestone.id].length > 0 ? (
                      <TaskList
                        tasks={groupedTasks[milestoneData.milestone.id]}
                        milestoneId={milestoneData.milestone.id}
                      />
                    ) : (
                      <EmptyMilestoneDropZone milestoneId={milestoneData.milestone.id} />
                    )}
                  </li>
                ))}

                {/* Tasks with no milestone */}
                {groupedTasks["no_milestone"].length > 0 && (
                  <li>
                    {/* No milestone header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-dimmed border-b border-surface-outline">
                      <div className="flex items-center gap-2">
                        {/* No progress pie chart for tasks without milestone */}
                        <span className="text-sm font-semibold text-content-base">No milestone</span>
                        {/* No indicators for 'No milestone' header */}
                      </div>
                      <button
                        className="text-content-subtle hover:text-content-base"
                        onClick={() => {
                          setActiveTaskMilestoneId("no-milestone");
                          setIsTaskModalOpen(true);
                        }}
                      >
                        <IconPlus size={16} />
                      </button>
                    </div>

                    {/* Tasks with no milestone */}
                    <TaskList tasks={groupedTasks["no_milestone"]} milestoneId="no-milestone" />
                  </li>
                )}
              </ul>
            </div>
          </DragAndDropProvider>
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
