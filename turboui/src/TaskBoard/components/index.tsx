import React, { useState } from "react";
import { StatusBadge } from "../../StatusBadge";
import { SecondaryButton } from "../../Button";
import { BlackLink } from "../../Link";
import { AvatarWithName } from "../../Avatar/AvatarWithName";
import { IconFileText, IconMessageCircle, IconClock } from "@tabler/icons-react";

export namespace TaskBoard {
  export type Status = "pending" | "in_progress" | "done";

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

  export interface Label {
    id: string;
    name: string;
    color: string;
  }

  export interface Task {
    id: string;
    title: string;
    status: Status;
    description?: string;
    assignees?: Person[];
    labels?: Label[];
    milestone?: Milestone;
    points?: number;
    dueDate?: Date;
    hasComments?: boolean;
    hasDescription?: boolean;
    commentCount?: number;
  }

  export type TaskViewMode = "table" | "kanban" | "timeline";

  export interface Props {
    title: string;
    tasks: Task[];
    viewMode?: TaskViewMode;
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

// Map task status to badge status and labels
const taskStatusConfig: Record<TaskBoard.Status, { status: string; label: string }> = {
  pending: { status: "paused", label: "Not started" },
  in_progress: { status: "pending", label: "In progress" },
  done: { status: "completed", label: "Done" },
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
      {isOverdue && (
        <IconClock 
          size={14} 
          className="mr-1 text-red-500" 
        />
      )}
      {formatDate(dueDate)}
    </span>
  );
}

export function TaskBoard({ title, tasks, viewMode = "table" }: TaskBoard.Props) {
  const [currentViewMode, setCurrentViewMode] = useState<TaskBoard.TaskViewMode>(viewMode);

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
                  <th className="text-left py-1.5 px-4 font-semibold">Labels</th>
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
                      <StatusBadge
                        status={taskStatusConfig[task.status].status}
                        customLabel={taskStatusConfig[task.status].label}
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
                    <td className="py-1 px-4">
                      {task.labels && task.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.map((label) => (
                            <span
                              key={label.id}
                              className="px-2 py-0.5 text-xs rounded-full"
                              style={{ backgroundColor: `${label.color}20`, color: label.color }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-content-subtle">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-content-subtle">
                      No tasks available
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
