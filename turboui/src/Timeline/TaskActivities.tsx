import { Trans } from "../Translate";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";
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
  IconCircleXCustom,
  IconTrash,
} from "../icons";
import { TaskActivityProps, TaskActivity, TaskStatus } from "./types";
import { DateField } from "../DateField";
import { capitalizeFirstLetter } from "../utils/strings";

export function TaskActivityItem({ activity, formattedTimePreferences }: TaskActivityProps) {
  return (
    <div className="flex gap-3 py-1.5 px-4 text-content-subtle text-sm relative">
      <div className="shrink-0 mt-0.5">
        <ActivityIcon activity={activity} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <div className="min-w-0">
            <ActivityText activity={activity} />
          </div>
        </div>
      </div>

      <div className="shrink-0 mt-0.5">
        <span className="text-content-subtle text-xs">
          <FormattedTime {...formattedTimePreferences} time={activity.insertedAt} format="relative" />
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
    case "task_comment_deleting":
      return <IconTrash {...iconProps} className="text-orange-500" />;
    case "task_name_updating":
      return <IconEdit {...iconProps} className="text-gray-500" />;
    case "task_adding":
      return <IconPlus {...iconProps} className="text-green-500" />;
    default:
      return <IconActivity {...iconProps} />;
  }
}

function getStatusIcon(status: TaskStatus | null) {
  if (!status) {
    return <IconCircle size={12} className="text-gray-500" />;
  }
  switch (status.color) {
    case "gray":
      return <IconCircle size={12} className="text-gray-500" />;
    case "blue":
      return <IconClockPlay size={12} className="text-blue-500" />;
    case "green":
      return <IconCircleCheck size={12} className="text-green-500" />;
    case "red":
      return <IconCircleXCustom size={12} className="text-red-500" />;
    default:
      return <IconCircle size={12} className="text-gray-500" />;
  }
}

function ActivityText({ activity }: { activity: TaskActivity }) {
  useTranslation();
  const taskName = formatTaskName(activity);
  const author = <ActivityAuthor activity={activity} />;

  switch (activity.type) {
    case "task_assignee_updating":
      if (activity.action === "assigned") {
        return (
          <span className="text-content-dimmed">
            <Trans
              i18nKey="<author/> assigned {{taskName}} to <assignee>{{name}}</assignee>"
              values={{ taskName, name: shortName(activity.assignee.fullName) }}
              components={{
                author,
                assignee: activity.assignee.profileLink ? (
                  <BlackLink
                    to={activity.assignee.profileLink}
                    underline="hover"
                    className="font-medium text-content-dimmed"
                  />
                ) : (
                  <span className="font-medium text-content-dimmed" />
                ),
              }}
            />
          </span>
        );
      } else {
        return (
          <span className="text-content-dimmed">
            <Trans
              i18nKey="<author/> unassigned <assignee>{{name}}</assignee> from {{taskName}}"
              values={{ taskName, name: shortName(activity.assignee.fullName) }}
              components={{
                author,
                assignee: activity.assignee.profileLink ? (
                  <BlackLink
                    to={activity.assignee.profileLink}
                    underline="hover"
                    className="font-medium text-content-dimmed"
                  />
                ) : (
                  <span className="font-medium text-content-dimmed" />
                ),
              }}
            />
          </span>
        );
      }

    case "task_status_updating":
      return (
        <span className="text-content-dimmed">
          <Trans
            i18nKey="<author/> changed status of {{taskName}} from <text>{{formatStatus}}</text> to <text2>{{formatStatus2}}</text2>"
            values={{
              taskName: taskName,
              formatStatus: formatStatus(activity.fromStatus),
              formatStatus2: formatStatus(activity.toStatus),
            }}
            components={{
              author,
              text: <span className="font-medium text-content-dimmed" />,
              text2: <span className="font-medium text-content-dimmed" />,
            }}
          />
        </span>
      );

    case "task_milestone_updating":
      if (activity.action === "attached") {
        return (
          <span className="text-content-dimmed">
            <Trans
              i18nKey="<author/> attached {{taskName}} to milestone <text>{{name}}</text>"
              values={{ taskName: taskName, name: activity.milestone.name }}
              components={{ author, text: <span className="font-medium text-content-dimmed" /> }}
            />
          </span>
        );
      } else {
        return (
          <span className="text-content-dimmed">
            <Trans
              i18nKey="<author/> detached {{taskName}} from milestone <text>{{name}}</text>"
              values={{ taskName: taskName, name: activity.milestone.name }}
              components={{ author, text: <span className="font-medium text-content-dimmed" /> }}
            />
          </span>
        );
      }

    case "task_due_date_updating":
      if (activity.toDueDate && !activity.fromDueDate) {
        return (
          <span className="text-content-dimmed flex items-center gap-1">
            <Trans
              i18nKey="<author/> set the due date for {{taskName}} to <text><date/></text>"
              values={{ taskName: taskName }}
              components={{
                author,
                text: <span className="font-medium text-content-dimmed" />,
                date: <DateField date={activity.toDueDate} readonly hideCalendarIcon />,
              }}
            />
          </span>
        );
      } else if (!activity.toDueDate && activity.fromDueDate) {
        return (
          <span className="text-content-subtle">
            <Trans
              i18nKey="<author/> removed due date from {{taskName}}"
              values={{ taskName }}
              components={{ author }}
            />
          </span>
        );
      } else if (activity.toDueDate && activity.fromDueDate) {
        return (
          <span className="text-content-dimmed flex items-center gap-1">
            <Trans
              i18nKey="<author/> changed the due date of {{taskName}} from <text><date/></text> to <text2><date2/></text2>"
              values={{ taskName: taskName }}
              components={{
                author,
                text: <span className="font-medium text-content-dimmed" />,
                date: <DateField date={activity.fromDueDate} readonly hideCalendarIcon />,
                text2: <span className="font-medium text-content-dimmed" />,
                date2: <DateField date={activity.toDueDate} readonly hideCalendarIcon />,
              }}
            />
          </span>
        );
      }
      return (
        <span className="text-content-dimmed">
          <Trans i18nKey="<author/> updated due date" components={{ author }} />
        </span>
      );

    case "task_description_change":
      return (
        <span className="text-content-dimmed">
          {activity.hasContent ? (
            activity.page === "task" ? (
              <Trans i18nKey="<author/> updated the description " components={{ author }} />
            ) : (
              <Trans
                i18nKey="<author/> updated the description of {{taskName}}"
                values={{ taskName }}
                components={{ author }}
              />
            )
          ) : activity.page === "task" ? (
            <Trans i18nKey="<author/> removed the description " components={{ author }} />
          ) : (
            <Trans
              i18nKey="<author/> removed the description from {{taskName}}"
              values={{ taskName }}
              components={{ author }}
            />
          )}
        </span>
      );

    case "task_comment_deleting":
      return (
        <span className="text-content-dimmed">
          <Trans i18nKey="<author/> deleted a comment on {{taskName}}" values={{ taskName }} components={{ author }} />
        </span>
      );

    case "task_name_updating":
      return (
        <span className="text-content-dimmed">
          {activity.page === "task" ? (
            <Trans
              i18nKey={
                '<author/> changed the title of this task from <from>"{{fromTitle}}"</from> to <to>"{{toTitle}}"</to>'
              }
              values={{ fromTitle: activity.fromTitle, toTitle: activity.toTitle }}
              components={{
                author,
                from: <span className="font-medium text-content-dimmed" />,
                to: <span className="font-medium text-content-dimmed" />,
              }}
            />
          ) : (
            <Trans
              i18nKey={
                '<author/> changed the title of a task from <from>"{{fromTitle}}"</from> to <to>"{{toTitle}}"</to>'
              }
              values={{ fromTitle: activity.fromTitle, toTitle: activity.toTitle }}
              components={{
                author,
                from: <span className="font-medium text-content-dimmed" />,
                to: <span className="font-medium text-content-dimmed" />,
              }}
            />
          )}
        </span>
      );

    case "task_adding":
      return (
        <span className="text-content-dimmed">
          <Trans i18nKey="<author/> created {{taskName}}" values={{ taskName }} components={{ author }} />
        </span>
      );

    default:
      return (
        <span className="text-content-dimmed">
          <Trans i18nKey="<author/> performed an action" components={{ author }} />
        </span>
      );
  }
}

function ActivityAuthor({ activity }: { activity: TaskActivity }) {
  return (
    <span className="font-medium text-content-dimmed">
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
    </span>
  );
}

function formatTaskName(activity: TaskActivity): string {
  if (activity.page === "task") {
    return i18n.t("this task");
  } else if ("taskName" in activity) {
    return `"${activity.taskName}"`;
  } else {
    return `"${activity.toTitle}"`;
  }
}

function formatStatus(status: TaskStatus | null): string {
  if (!status) {
    return "";
  }

  if (status.label) {
    return status.label;
  }

  return capitalizeFirstLetter(status.value);
}
