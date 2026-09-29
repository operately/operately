import React from "react";

import type { ActivityContentTaskAssigneeUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n, { tn } from "@/i18n";
import { activityAuthorName, projectLink, spaceLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { hasAggregatedTasks, UpdatedTaskList } from "../taskUpdatedResources";
import { AvatarWithName } from "turboui";

const TaskAssigneeUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { project, space, task } = content(activity);

    if (project && task) {
      return paths.taskPath(task.id);
    }

    if (project) {
      return paths.projectPath(project.id, { tab: "tasks" });
    }

    if (task) {
      return paths.spaceKanbanPath(space.id, { taskId: task.id });
    }

    return paths.spaceKanbanPath(space.id);
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const { project, space, task } = content(activity);
    const location = project ? projectLink(paths, project) : spaceLink(paths, space);
    const showLocation = page !== "project" && !(page === "space" && !project);
    const values = {
      author: activityAuthorName(activity),
      taskName: task?.name ?? i18n.t("a task"),
      locationName: project?.name ?? space.name,
    };

    if (hasAggregatedTasks(activity)) {
      const tasks = <UpdatedTaskList activity={activity} paths={paths} />;

      return showLocation ? (
        <Trans
          i18nKey="{{author}} updated assignees on <tasks/> in <location>{{locationName}}</location>"
          values={values}
          components={{ tasks, location }}
        />
      ) : (
        <Trans i18nKey="{{author}} updated assignees on <tasks/>" values={values} components={{ tasks }} />
      );
    }

    const change = assignmentChange(content(activity));
    const taskAnchor = task ? taskLink(paths, task, { spaceId: !project ? space.id : undefined }) : <React.Fragment />;
    return (
      <Trans
        defaults={feedMessage(change, showLocation)}
        values={{ ...values, ...change }}
        components={{ task: taskAnchor, location }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    if (hasAggregatedTasks(activity)) return null;

    const { oldAssignee, newAssignee, addedAssignees, removedAssignees } = content(activity);
    const added = addedAssignees || [];
    const removed = removedAssignees || [];

    if (!newAssignee && added.length !== 1) return null;

    return (
      <div className="flex items-center gap-2">
        {removed.length > 1 ? (
          <span>
            {tn("Previously assigned to {{count}} person", "Previously assigned to {{count}} people", removed.length)}
          </span>
        ) : oldAssignee ? (
          <>
            <span>
              <Trans i18nKey="Previously assigned to:" />
            </span>
            <div className="flex items-center gap-1">
              <AvatarWithName person={oldAssignee} size="tiny" />
            </div>
          </>
        ) : (
          <span>
            <Trans i18nKey="Previously it was unassigned" />
          </span>
        )}
      </div>
    );
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(props: { activity: Activity }) {
    return notificationMessage(content(props.activity));
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project, space } = content(props.activity);

    if (project) {
      return project.name;
    }

    return space.name;
  },
};

function content(activity: Activity): ActivityContentTaskAssigneeUpdating {
  return activity.content as ActivityContentTaskAssigneeUpdating;
}

type AssignmentChange =
  | { kind: "assigned" | "unassigned"; personName: string }
  | { kind: "addedMany" | "removedMany"; count: number }
  | { kind: "changed" | "updated" };

function assignmentChange(content: ActivityContentTaskAssigneeUpdating): AssignmentChange {
  const added = content.addedAssignees || [];
  const removed = content.removedAssignees || [];
  const [addedAssignee] = added;
  const [removedAssignee] = removed;

  if (addedAssignee && added.length === 1 && removed.length === 0)
    return { kind: "assigned", personName: addedAssignee.fullName };
  if (removedAssignee && removed.length === 1 && added.length === 0)
    return { kind: "unassigned", personName: removedAssignee.fullName };
  if (added.length > 0 && removed.length > 0) return { kind: "changed" };
  if (added.length > 1) return { kind: "addedMany", count: added.length };
  if (removed.length > 1) return { kind: "removedMany", count: removed.length };
  if (content.newAssignee) return { kind: "assigned", personName: content.newAssignee.fullName };
  if (content.oldAssignee) return { kind: "unassigned", personName: content.oldAssignee.fullName };
  return { kind: "updated" };
}

function feedMessage(change: AssignmentChange, showLocation: boolean): string {
  switch (change.kind) {
    case "assigned":
      return showLocation
        ? i18n.t(
            "{{author}} assigned to {{personName}} the task <task>{{taskName}}</task> in <location>{{locationName}}</location>",
          )
        : i18n.t("{{author}} assigned to {{personName}} the task <task>{{taskName}}</task>");
    case "unassigned":
      return showLocation
        ? i18n.t(
            "{{author}} unassigned {{personName}} from the task <task>{{taskName}}</task> in <location>{{locationName}}</location>",
          )
        : i18n.t("{{author}} unassigned {{personName}} from the task <task>{{taskName}}</task>");
    case "changed":
      return showLocation
        ? i18n.t(
            "{{author}} changed assignees on the task <task>{{taskName}}</task> in <location>{{locationName}}</location>",
          )
        : i18n.t("{{author}} changed assignees on the task <task>{{taskName}}</task>");
    case "addedMany":
      return showLocation
        ? tn(
            "{{author}} assigned {{count}} person to the task <task>{{taskName}}</task> in <location>{{locationName}}</location>",
            "{{author}} assigned {{count}} people to the task <task>{{taskName}}</task> in <location>{{locationName}}</location>",
            change.count,
          )
        : tn(
            "{{author}} assigned {{count}} person to the task <task>{{taskName}}</task>",
            "{{author}} assigned {{count}} people to the task <task>{{taskName}}</task>",
            change.count,
          );
    case "removedMany":
      return showLocation
        ? tn(
            "{{author}} unassigned {{count}} person from the task <task>{{taskName}}</task> in <location>{{locationName}}</location>",
            "{{author}} unassigned {{count}} people from the task <task>{{taskName}}</task> in <location>{{locationName}}</location>",
            change.count,
          )
        : tn(
            "{{author}} unassigned {{count}} person from the task <task>{{taskName}}</task>",
            "{{author}} unassigned {{count}} people from the task <task>{{taskName}}</task>",
            change.count,
          );
    case "updated":
      return showLocation
        ? i18n.t(
            "{{author}} updated assignees on the task <task>{{taskName}}</task> in <location>{{locationName}}</location>",
          )
        : i18n.t("{{author}} updated assignees on the task <task>{{taskName}}</task>");
  }
}

function notificationMessage(content: ActivityContentTaskAssigneeUpdating): string {
  const added = content.addedAssignees || [];
  const removed = content.removedAssignees || [];
  const [addedAssignee] = added;
  const [removedAssignee] = removed;
  const taskName = content.task?.name;

  if (addedAssignee && added.length === 1 && removed.length === 0) {
    const values = { taskName, personName: addedAssignee.fullName };
    return content.task
      ? i18n.t('Task "{{taskName}}" was assigned to {{personName}}', values)
      : i18n.t("A task was assigned to {{personName}}", values);
  }
  if (removedAssignee && removed.length === 1 && added.length === 0) {
    const values = { taskName, personName: removedAssignee.fullName };
    return content.task
      ? i18n.t('Task "{{taskName}}" was no longer assigned to {{personName}}', values)
      : i18n.t("A task was no longer assigned to {{personName}}", values);
  }
  if (added.length > 0 || removed.length > 0) {
    return content.task
      ? i18n.t('Task "{{taskName}}" was updated with new assignees', { taskName })
      : i18n.t("A task was updated with new assignees");
  }
  if (content.newAssignee) {
    const values = { taskName, personName: content.newAssignee.fullName };
    return content.task
      ? i18n.t('Task "{{taskName}}" was assigned to {{personName}}', values)
      : i18n.t("A task was assigned to {{personName}}", values);
  }
  return content.task ? i18n.t('Task "{{taskName}}" was unassigned', { taskName }) : i18n.t("A task was unassigned");
}

export default TaskAssigneeUpdating;
