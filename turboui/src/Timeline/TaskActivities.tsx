import React from "react";
import { Avatar } from "../Avatar";
import { shortName } from "../Avatar/AvatarWithName";
import { BlackLink } from "../Link";
import FormattedTime from "../FormattedTime";
import * as Icons from "@tabler/icons-react";
import { TaskActivityProps, TaskActivity } from "./types";

export function TaskActivityItem({ activity }: TaskActivityProps) {
  return (
    <div className="flex items-start gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative">
      <div className="shrink-0">
        <Avatar person={activity.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-semibold">
              {activity.author.profileLink ? (
                <BlackLink to={activity.author.profileLink} underline="hover">
                  {shortName(activity.author.fullName)}
                </BlackLink>
              ) : (
                shortName(activity.author.fullName)
              )}
            </div>
            <ActivityIcon activity={activity} />
            <ActivityText activity={activity} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={activity.insertedAt} format="relative" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ activity }: { activity: TaskActivity }) {
  const iconProps = { size: 16, className: "text-content-dimmed" };
  
  switch (activity.type) {
    case "task-assignment":
      return <Icons.IconUserPlus {...iconProps} className="text-blue-500" />;
    case "task-status-change":
      return getStatusIcon(activity.toStatus);
    case "task-milestone":
      return activity.action === "attached" 
        ? <Icons.IconTarget {...iconProps} className="text-green-500" />
        : <Icons.IconTargetOff {...iconProps} className="text-orange-500" />;
    case "task-priority":
      return getPriorityIcon(activity.toPriority);
    case "task-due-date":
      return activity.toDueDate 
        ? <Icons.IconCalendarPlus {...iconProps} className="text-blue-500" />
        : <Icons.IconCalendarMinus {...iconProps} className="text-orange-500" />;
    case "task-description":
      return <Icons.IconFileText {...iconProps} className="text-purple-500" />;
    case "task-title":
      return <Icons.IconEdit {...iconProps} className="text-gray-500" />;
    case "task-creation":
      return <Icons.IconPlus {...iconProps} className="text-green-500" />;
    default:
      return <Icons.IconActivity {...iconProps} />;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "todo":
      return <Icons.IconCircle size={16} className="text-gray-500" />;
    case "in_progress":
      return <Icons.IconClockPlay size={16} className="text-blue-500" />;
    case "done":
      return <Icons.IconCircleCheck size={16} className="text-green-500" />;
    default:
      return <Icons.IconCircle size={16} className="text-gray-500" />;
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case "urgent":
      return <Icons.IconAlertTriangle size={16} className="text-red-500" />;
    case "high":
      return <Icons.IconChevronUp size={16} className="text-orange-500" />;
    case "normal":
      return <Icons.IconMinus size={16} className="text-gray-500" />;
    case "low":
      return <Icons.IconChevronDown size={16} className="text-blue-500" />;
    default:
      return <Icons.IconMinus size={16} className="text-gray-500" />;
  }
}

function ActivityText({ activity }: { activity: TaskActivity }) {
  switch (activity.type) {
    case "task-assignment":
      if (activity.action === "assigned") {
        return (
          <span className="text-content-accent">
            assigned this task to{" "}
            {activity.assignee.profileLink ? (
              <BlackLink to={activity.assignee.profileLink} underline="hover" className="font-semibold">
                {shortName(activity.assignee.fullName)}
              </BlackLink>
            ) : (
              <span className="font-semibold">{shortName(activity.assignee.fullName)}</span>
            )}
          </span>
        );
      } else {
        return (
          <span className="text-content-accent">
            unassigned{" "}
            {activity.assignee.profileLink ? (
              <BlackLink to={activity.assignee.profileLink} underline="hover" className="font-semibold">
                {shortName(activity.assignee.fullName)}
              </BlackLink>
            ) : (
              <span className="font-semibold">{shortName(activity.assignee.fullName)}</span>
            )}
            {" "}from this task
          </span>
        );
      }

    case "task-status-change":
      return (
        <span className="text-content-accent">
          changed status from{" "}
          <span className="font-semibold">{formatStatus(activity.fromStatus)}</span>
          {" "}to{" "}
          <span className="font-semibold">{formatStatus(activity.toStatus)}</span>
        </span>
      );

    case "task-milestone":
      if (activity.action === "attached") {
        return (
          <span className="text-content-accent">
            attached this task to milestone{" "}
            <span className="font-semibold">{activity.milestone.title}</span>
          </span>
        );
      } else {
        return (
          <span className="text-content-accent">
            detached this task from milestone{" "}
            <span className="font-semibold">{activity.milestone.title}</span>
          </span>
        );
      }

    case "task-priority":
      return (
        <span className="text-content-accent">
          changed priority from{" "}
          <span className="font-semibold">{formatPriority(activity.fromPriority)}</span>
          {" "}to{" "}
          <span className="font-semibold">{formatPriority(activity.toPriority)}</span>
        </span>
      );

    case "task-due-date":
      if (activity.toDueDate && !activity.fromDueDate) {
        return (
          <span className="text-content-accent">
            set due date to{" "}
            <span className="font-semibold">
              <FormattedTime time={activity.toDueDate} format="short-date" />
            </span>
          </span>
        );
      } else if (!activity.toDueDate && activity.fromDueDate) {
        return (
          <span className="text-content-accent">
            removed due date
          </span>
        );
      } else if (activity.toDueDate && activity.fromDueDate) {
        return (
          <span className="text-content-accent">
            changed due date from{" "}
            <span className="font-semibold">
              <FormattedTime time={activity.fromDueDate} format="short-date" />
            </span>
            {" "}to{" "}
            <span className="font-semibold">
              <FormattedTime time={activity.toDueDate} format="short-date" />
            </span>
          </span>
        );
      }
      return <span className="text-content-accent">updated due date</span>;

    case "task-description":
      return (
        <span className="text-content-accent">
          {activity.hasContent ? "updated the description" : "removed the description"}
        </span>
      );

    case "task-title":
      return (
        <span className="text-content-accent">
          changed title from{" "}
          <span className="font-semibold">"{activity.fromTitle}"</span>
          {" "}to{" "}
          <span className="font-semibold">"{activity.toTitle}"</span>
        </span>
      );

    case "task-creation":
      return (
        <span className="text-content-accent">
          created this task
        </span>
      );

    default:
      return <span className="text-content-accent">performed an action</span>;
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case "todo":
      return "To Do";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return status;
  }
}

function formatPriority(priority: string): string {
  switch (priority) {
    case "urgent":
      return "Urgent";
    case "high":
      return "High";
    case "normal":
      return "Normal";
    case "low":
      return "Low";
    default:
      return priority;
  }
}