import React from "react";
import { BlackLink } from "../../Link";
import { AvatarWithName } from "../../Avatar/AvatarWithName";
import { IconFileText, IconMessageCircle } from "@tabler/icons-react";
import { useDraggable } from "../../utils/DragAndDrop";
import classNames from "../../utils/classnames";
import { StatusSelector } from "./StatusSelector";
import { DueDateDisplay } from "./DueDateDisplay";

// Using shared types
import * as Types from "../types";
import { TaskWithIndex } from "../types";

interface TaskItemProps {
  task: TaskWithIndex;
  milestoneId: string;
  itemStyle: (id: string) => React.CSSProperties;
}

export function TaskItem({
  task,
  milestoneId,
  itemStyle,
}: TaskItemProps) {
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
