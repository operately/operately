import React from "react";
import type { ActivityContentTaskArchiveUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink, spaceLink, taskLink } from "../feedItemLinks";
import { hasAggregatedTasks, UpdatedTaskList } from "../taskUpdatedResources";

function content(activity: Activity): ActivityContentTaskArchiveUpdating {
  return activity.content as ActivityContentTaskArchiveUpdating;
}

const TaskArchiveUpdating: ActivityHandler = {
  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const { task, project, space, name, archived } = content(activity);
    const showLocation = page !== "project" && page !== "task" && !(page === "space" && !project);
    const values = {
      author: activityAuthorName(activity),
      taskName: task?.name ?? name,
      locationName: project?.name ?? space.name,
    };
    const components = {
      location: project ? projectLink(paths, project) : spaceLink(paths, space),
      task: task ? taskLink(paths, task, { spaceId: project ? undefined : space.id }) : <React.Fragment />,
    };

    if (hasAggregatedTasks(activity)) {
      const groupedComponents = { ...components, tasks: <UpdatedTaskList activity={activity} paths={paths} /> };
      const sentence = archived
        ? showLocation
          ? i18n.t("{{author}} archived tasks <tasks/> in <location>{{locationName}}</location>")
          : i18n.t("{{author}} archived tasks <tasks/>")
        : showLocation
          ? i18n.t("{{author}} restored tasks <tasks/> to the board in <location>{{locationName}}</location>")
          : i18n.t("{{author}} restored tasks <tasks/> to the board");
      return <Trans defaults={sentence} values={values} components={groupedComponents} />;
    }

    if (showLocation) {
      return archived ? (
        <Trans
          i18nKey="{{author}} archived <task>{{taskName}}</task> in <location>{{locationName}}</location>"
          values={values}
          components={components}
        />
      ) : (
        <Trans
          i18nKey="{{author}} restored <task>{{taskName}}</task> to the board in <location>{{locationName}}</location>"
          values={values}
          components={components}
        />
      );
    }

    return archived ? (
      <Trans i18nKey="{{author}} archived <task>{{taskName}}</task>" values={values} components={components} />
    ) : (
      <Trans
        i18nKey="{{author}} restored <task>{{taskName}}</task> to the board"
        values={values}
        components={components}
      />
    );
  },

  FeedItemContent: () => null,

  feedItemAlignment: () => "items-center",

  pagePath(paths, activity) {
    const { task, project, space } = content(activity);
    if (task && project) return paths.taskPath(task.id);
    if (project) return paths.projectPath(project.id);
    return paths.spaceKanbanPath(space.id, task ? { taskId: task.id } : undefined);
  },

  pageHtmlTitle: (activity) => content(activity).name,

  PageTitle: ({ activity }) => <>{content(activity).name}</>,

  PageContent: () => <></>,

  PageOptions: () => null,

  NotificationTitle: ({ activity }) =>
    content(activity).archived ? i18n.t("Archive task") : i18n.t("Restore to board"),

  NotificationLocation: ({ activity }) => content(activity).project?.name ?? content(activity).space.name,

  commentCount: () => 0,

  hasComments: () => false,
};

export default TaskArchiveUpdating;
