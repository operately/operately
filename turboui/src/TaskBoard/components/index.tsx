import React, { useState } from "react";
import { StatusBadge } from "../../StatusBadge";
import { SecondaryButton } from "../../Button";
import { BlackLink } from "../../Link";
import { AvatarWithName } from "../../Avatar/AvatarWithName";
import {
  IconFileText,
  IconMessageCircle,
  IconClock,
  IconCheck,
  IconCircleDashed,
  IconPointFilled,
  IconX,
} from "@tabler/icons-react";
import { Menu, MenuActionItem } from "../../Menu";

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

// Map task status to badge status, labels and icons
const taskStatusConfig: Record<TaskBoard.Status, { status: string; label: string; icon: any }> = {
  pending: { status: "not_started", label: "Not started", icon: IconCircleDashed },
  in_progress: { status: "in_progress", label: "In progress", icon: IconPointFilled },
  done: { status: "completed", label: "Done", icon: IconCheck },
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
}: {
  task: TaskBoard.Task;
  onStatusChange?: (newStatus: TaskBoard.Status) => void;
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  // Filter status options based on search term
  const filteredStatusOptions = Object.entries(taskStatusConfig).filter(
    ([_, config]) => 
      config.label.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="cursor-pointer">
          <StatusBadge
            status={taskStatusConfig[task.status].status}
            customLabel={taskStatusConfig[task.status].label}
          />
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
              {isCurrentStatus && (
                <IconCheck size={14} className="text-primary-500 ml-2" />
              )}
            </div>
          </MenuActionItem>
        );
      })}
    </Menu>
  );
}

// Helper component to display due date with appropriate formatting
function DueDateDisplay({ dueDate }: { dueDate: Date }) {
  // Check if the due date is in the past
  const isOverdue = dueDate < new Date();

  // Format the date to a readable format
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <span
      className={`text-sm flex items-center ${isOverdue ? "text-red-600 font-medium" : "text-content-base"}`}
      title={isOverdue ? "Overdue" : ""}
    >
      {isOverdue && <IconClock size={14} className="mr-1 text-red-500" />}
      {formatDate(dueDate)}
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
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-surface-outline bg-surface-dimmed text-content-base text-xs sm:text-sm sticky top-0">
                  <th className="text-left py-1.5 px-4 font-semibold">Task</th>
                  <th className="text-left py-1.5 px-4 font-semibold">Status</th>
                  <th className="text-left py-1.5 px-4 font-semibold">Assignee</th>
                  <th className="text-left py-1.5 px-4 font-semibold">Due</th>
                  <th className="text-left py-1.5 px-4 font-semibold">Milestone</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="group border-b border-stroke-base bg-surface-base hover:bg-surface-highlight"
                  >
                    <td className="py-1 px-4">
                      <div className="flex items-center">
                        <BlackLink
                          to={`/tasks/${task.id}`}
                          className="text-sm text-content-base hover:text-link-hover transition-colors"
                          underline="hover"
                        >
                          {task.title}
                        </BlackLink>
                        {task.hasDescription && (
                          <span className="ml-2 text-content-subtle">
                            <IconFileText size={16} />
                          </span>
                        )}
                        {task.hasComments && (
                          <span className="ml-2 text-content-subtle flex items-center">
                            <IconMessageCircle size={16} />
                            {task.commentCount && (
                              <span className="ml-1 text-xs text-content-subtle">{task.commentCount}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 px-4">
                      <StatusSelector
                        task={task}
                        onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                      />
                    </td>
                    <td className="py-1 px-4">
                      {task.assignees && task.assignees.length > 0 ? (
                        <AvatarWithName person={task.assignees[0]} size="tiny" nameFormat="short" className="text-sm" />
                      ) : (
                        <span className="text-sm text-content-subtle">—</span>
                      )}
                    </td>
                    <td className="py-1 px-4">
                      {task.dueDate ? (
                        <DueDateDisplay dueDate={task.dueDate} />
                      ) : (
                        <span className="text-sm text-content-subtle">—</span>
                      )}
                    </td>
                    <td className="py-1 px-4">
                      {task.milestone ? (
                        <span className="text-sm text-content-base">{task.milestone.name}</span>
                      ) : (
                        <span className="text-sm text-content-subtle">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-content-subtle">
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
