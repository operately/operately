import React, { useState, useCallback } from "react";
import { BlackLink } from "../../Link";
import { PersonField } from "../../PersonField";
import { IconFileText, IconMessageCircle } from "@tabler/icons-react";
import { useDraggable } from "../../utils/DragAndDrop";
import classNames from "../../utils/classnames";
import { StatusSelector } from "./StatusSelector";
import { DueDateDisplay } from "./DueDateDisplay";

// Using shared types
import { TaskWithIndex, Person } from "../types";

interface TaskItemProps {
  task: TaskWithIndex;
  milestoneId: string;
  itemStyle: (id: string) => React.CSSProperties;
  onTaskUpdate?: (taskId: string, updates: Partial<TaskWithIndex>) => void;
  searchPeople?: (params: { query: string }) => Promise<Person[]>;
}

export function TaskItem({ task, milestoneId, itemStyle, onTaskUpdate, searchPeople }: TaskItemProps) {
  // Local state for the assignee
  const [currentAssignee, setCurrentAssignee] = useState<Person | null>(task.assignees?.[0] || null);
  
  // Set up draggable behavior
  const { ref, isDragging } = useDraggable({ id: task.id, zoneId: `milestone-${milestoneId}` });

  const itemClasses = classNames(isDragging ? "opacity-50 bg-surface-accent" : "");

  // Handle assignee change locally and notify parent
  const handleAssigneeChange = useCallback((newAssignee: Person | null) => {
    setCurrentAssignee(newAssignee);
    
    // Notify parent component if callback is provided
    if (onTaskUpdate && task.id) {
      onTaskUpdate(task.id, { 
        assignees: newAssignee ? [newAssignee] : [] 
      });
    }
  }, [task.id, onTaskUpdate]);

  // Handle status change
  const handleStatusChange = useCallback((newStatus: string) => {
    // Notify parent component if callback is provided
    if (onTaskUpdate && task.id) {
      onTaskUpdate(task.id, { status: newStatus as any });
    }
    
    // Also dispatch event for backward compatibility
    const changeEvent = new CustomEvent("statusChange", {
      detail: { taskId: task.id, newStatus },
    });
    document.dispatchEvent(changeEvent);
  }, [task.id, onTaskUpdate]);

  return (
    <li ref={ref as React.RefObject<HTMLLIElement>} style={itemStyle(task.id)} className={itemClasses}>
      <div className="flex items-center px-4 py-2.5 group bg-surface-base hover:bg-surface-highlight">
        {/* Left side: Status and task info */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {/* Status icon */}
          <div className="flex-shrink-0 flex items-center">
            <StatusSelector
              task={task}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Task title with inline meta indicators */}
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <BlackLink
              to={`/tasks/${task.id}`}
              className="text-sm hover:text-link-hover transition-colors truncate"
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
          </div>
        </div>

        {/* Right side: Due date and assignee */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {/* Due date */}
          {task.dueDate && (
            <span className="text-xs text-content-subtle flex items-center">
              <DueDateDisplay dueDate={task.dueDate} />
            </span>
          )}

          {/* Assignee */}
          <div className="flex items-center flex-shrink-0 w-6 h-6">
            <PersonField
              person={currentAssignee}
              setPerson={handleAssigneeChange}
              avatarSize={24}
              avatarOnly={true}
              searchPeople={searchPeople || (async () => [])}
              readonly={!searchPeople}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
