import React from "react";
import { shortName } from "../Avatar/AvatarWithName";
import { BlackLink } from "../Link";
import FormattedTime from "../FormattedTime";
import {
  IconUserPlus,
  IconFlag,
  IconFlagX,
  IconCalendarPlus,
  IconCalendarMinus,
  IconFileText,
  IconEdit,
  IconPlus,
  IconCircle,
  IconActivity,
  IconCircleCheck,
  IconClockPlay,
} from "../icons";
import { TaskActivityProps, TaskActivity } from "./types";
import { DateField } from "../DateField";
import { capitalizeFirstLetter } from "../utils/strings";

export function TaskActivityItem({ activity }: TaskActivityProps) {
  return (
    <div className="flex gap-3 py-1.5 text-content-subtle text-sm relative ml-2">
      <div className="shrink-0 mt-0.5">
        <ActivityIcon activity={activity} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <div className="font-medium text-content-dimmed shrink-0">
            {activity.author.profileLink ? (
              <BlackLink
                to={activity.author.profileLink}
                underline="hover"
                className="text-content-dimmed hover:text-content-accent"
              >
                {shortName(activity.author.fullName)}
              </BlackLink>
            ) : (
              shortName(activity.author.fullName)
            )}
          </div>
          <div className="min-w-0">
            <ActivityText activity={activity} />
          </div>
        </div>
      </div>

      <div className="shrink-0 mt-0.5">
        <span className="text-content-subtle text-xs">
          <FormattedTime time={activity.insertedAt} format="relative" />
        </span>
      </div>
    </div>
  );
}

function ActivityIcon({ activity }: { activity: TaskActivity }) {
  const iconProps = { size: 12, className: "text-content-subtle" };

  switch (activity.type) {
    case "task_assignee_updating":
      return <IconUserPlus {...iconProps} className="text-blue-500" />;
    case "task_status_updating":
      return getStatusIcon(activity.toStatus);
    case "task_milestone_updating":
      return activity.action === "attached" ? (
        <IconFlag {...iconProps} className="text-green-500" />
      ) : (
        <IconFlagX {...iconProps} className="text-orange-500" />
      );
    case "task_due_date_updating":
      return activity.toDueDate ? (
        <IconCalendarPlus {...iconProps} className="text-blue-500" />
      ) : (
        <IconCalendarMinus {...iconProps} className="text-orange-500" />
      );
    case "task_description_change":
      return <IconFileText {...iconProps} className="text-purple-500" />;
    case "task_name_updating":
      return <IconEdit {...iconProps} className="text-gray-500" />;
    case "task_adding":
      return <IconPlus {...iconProps} className="text-green-500" />;
    default:
      return <IconActivity {...iconProps} />;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "not_started":
      return <IconCircle size={12} className="text-gray-500" />;
    case "in_progress":
      return <IconClockPlay size={12} className="text-blue-500" />;
    case "done":
      return <IconCircleCheck size={12} className="text-green-500" />;
    default:
      return <IconCircle size={12} className="text-gray-500" />;
  }
}

function ActivityText({ activity }: { activity: TaskActivity }) {
  const taskName = formatTaskName(activity);

  switch (activity.type) {
    case "task_assignee_updating":
      if (activity.action === "assigned") {
        return (
          <span className="text-content-dimmed">
            assigned {taskName} to{" "}
            {activity.assignee.profileLink ? (
              <BlackLink
                to={activity.assignee.profileLink}
                underline="hover"
                className="font-medium text-content-dimmed"
              >
                {shortName(activity.assignee.fullName)}
              </BlackLink>
            ) : (
              <span className="font-medium text-content-dimmed">{shortName(activity.assignee.fullName)}</span>
            )}
          </span>
        );
      } else {
        return (
          <span className="text-content-dimmed">
            unassigned{" "}
            {activity.assignee.profileLink ? (
              <BlackLink
                to={activity.assignee.profileLink}
                underline="hover"
                className="font-medium text-content-dimmed"
              >
                {shortName(activity.assignee.fullName)}
              </BlackLink>
            ) : (
              <span className="font-medium text-content-dimmed">{shortName(activity.assignee.fullName)}</span>
            )}{" "}
            from {taskName}
          </span>
        );
      }

    case "task_status_updating":
      return (
        <span className="text-content-dimmed">
          changed status of {taskName} from{" "}
          <span className="font-medium text-content-dimmed">{formatStatus(activity.fromStatus)}</span> to{" "}
          <span className="font-medium text-content-dimmed">{formatStatus(activity.toStatus)}</span>
        </span>
      );

    case "task_milestone_updating":
      if (activity.action === "attached") {
        return (
          <span className="text-content-dimmed">
            attached {taskName} to milestone{" "}
            <span className="font-medium text-content-dimmed">{activity.milestone.name}</span>
          </span>
        );
      } else {
        return (
          <span className="text-content-dimmed">
            detached {taskName} from milestone{" "}
            <span className="font-medium text-content-dimmed">{activity.milestone.name}</span>
          </span>
        );
      }

    case "task_due_date_updating":
      if (activity.toDueDate && !activity.fromDueDate) {
        return (
          <span className="text-content-dimmed flex items-center gap-1">
            set due date for {taskName} to{" "}
            <span className="font-medium text-content-dimmed">
              <DateField date={activity.toDueDate} readonly hideCalendarIcon />
            </span>
          </span>
        );
      } else if (!activity.toDueDate && activity.fromDueDate) {
        return <span className="text-content-subtle">removed due date from {taskName}</span>;
      } else if (activity.toDueDate && activity.fromDueDate) {
        return (
          <span className="text-content-dimmed flex items-center gap-1">
            changed due date of {taskName} from{" "}
            <span className="font-medium text-content-dimmed">
              <DateField date={activity.fromDueDate} readonly hideCalendarIcon />
            </span>{" "}
            to{" "}
            <span className="font-medium text-content-dimmed">
              <DateField date={activity.toDueDate} readonly hideCalendarIcon />
            </span>
          </span>
        );
      }
      return <span className="text-content-dimmed">updated due date</span>;

    case "task_description_change":
      return (
        <span className="text-content-dimmed">
          {activity.hasContent
            ? `updated the description ${activity.page === "task" ? "" : "of " + taskName}`
            : `removed the description ${activity.page === "task" ? "" : "from " + taskName}`}
        </span>
      );

    case "task_name_updating":
      return (
        <span className="text-content-dimmed">
          changed title of {activity.page === "task" ? "this task" : "a task"} from{" "}
          <span className="font-medium text-content-dimmed">"{activity.fromTitle}"</span> to{" "}
          <span className="font-medium text-content-dimmed">"{activity.toTitle}"</span>
        </span>
      );

    case "task_adding":
      return <span className="text-content-dimmed">created {taskName}</span>;

    default:
      return <span className="text-content-dimmed">performed an action</span>;
  }
}

function formatTaskName(activity: TaskActivity): string {
  if (activity.page === "task") {
    return "this task";
  } else if ("taskName" in activity) {
    return `"${activity.taskName}"`;
  } else {
    return `"${activity.toTitle}"`;
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return capitalizeFirstLetter(status);
  }
}
