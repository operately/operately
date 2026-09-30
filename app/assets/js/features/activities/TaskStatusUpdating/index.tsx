import React from "react";

import type { ActivityContentTaskStatusUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink, spaceLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { hasAggregatedTasks, UpdatedTaskList } from "../taskUpdatedResources";

const TaskStatusUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { project, space, task } = content(activity);

    if (project && task) {
      return paths.taskPath(task.id);
    }

    if (project) {
      return paths.projectPath(project.id);
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
    const { project, space, task, newStatus, name } = content(activity);
    const location = project ? projectLink(paths, project) : spaceLink(paths, space);
    const values = {
      author: activityAuthorName(activity),
      taskName: task?.name ?? name,
      status: newStatus.label,
      locationName: project?.name ?? space.name,
    };
    const showLocation = page !== "project" && !(page === "space" && !project);

    if (hasAggregatedTasks(activity)) {
      const tasks = <UpdatedTaskList activity={activity} paths={paths} />;

      return showLocation ? (
        <Trans
          i18nKey="{{author}} updated the status of <tasks/> in <location>{{locationName}}</location>"
          values={values}
          components={{ tasks, location }}
        />
      ) : (
        <Trans i18nKey="{{author}} updated the status of <tasks/>" values={values} components={{ tasks }} />
      );
    }

    const taskAnchor = task ? taskLink(paths, task, { spaceId: !project ? space.id : undefined }) : <React.Fragment />;
    const sentence = showLocation
      ? task
        ? i18n.t("{{author}} marked <task>{{taskName}}</task> as {{status}} in <location>{{locationName}}</location>")
        : i18n.t('{{author}} marked the "{{taskName}}" task as {{status}} in <location>{{locationName}}</location>')
      : task
        ? i18n.t("{{author}} marked <task>{{taskName}}</task> as {{status}}")
        : i18n.t('{{author}} marked the "{{taskName}}" task as {{status}}');
    return <Trans defaults={sentence} values={values} components={{ task: taskAnchor, location }} />;
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    if (hasAggregatedTasks(activity)) return null;

    const { oldStatus, newStatus } = content(activity);

    return (
      <Trans
        i18nKey="Previously, the task was {{oldStatus}}. Now it's {{newStatus}}."
        values={{ oldStatus: oldStatus.label, newStatus: newStatus.label }}
      />
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
    const { newStatus, name } = content(props.activity);

    return i18n.t('Task "{{taskName}}" was marked as {{status}}', { taskName: name, status: newStatus.label });
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project, space } = content(props.activity);

    if (project) {
      return project.name;
    }
    return space.name;
  },
};

function content(activity: Activity): ActivityContentTaskStatusUpdating {
  return activity.content as ActivityContentTaskStatusUpdating;
}

export default TaskStatusUpdating;
