import { Trans } from "react-i18next";
import i18n from "@/i18n";
import React from "react";

import type { ActivityContentTaskNameUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { activityAuthorName, projectLink, spaceLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { hasAggregatedTasks, UpdatedTaskList } from "../taskUpdatedResources";

const TaskNameUpdating: ActivityHandler = {
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
    const { project, space, newName, task } = content(activity);

    const location = project ? projectLink(paths, project) : spaceLink(paths, space);

    if (hasAggregatedTasks(activity)) {
      const tasks = <UpdatedTaskList activity={activity} paths={paths} />;

      if (page === "project" || (page === "space" && !project)) {
        return (
          <Trans
            i18nKey="{{author}} renamed <tasks/>"
            values={{ author: activityAuthorName(activity) }}
            components={{ tasks }}
          />
        );
      } else {
        return (
          <Trans
            i18nKey="{{author}} renamed <tasks/> in <location>{{locationName}}</location>"
            values={{ author: activityAuthorName(activity), locationName: project?.name ?? space.name }}
            components={{ tasks, location }}
          />
        );
      }
    }

    const name = task
      ? taskLink(paths, task, { taskName: newName, spaceId: !project ? space.id : undefined })
      : newName;

    if (page === "project" || (page === "space" && !project)) {
      return (
        <Trans
          i18nKey="{{author}} renamed task to <task>{{newName}}</task>"
          values={{ author: activityAuthorName(activity), newName }}
          components={{ task: typeof name === "string" ? <></> : name }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} renamed task to <task>{{newName}}</task> in <location>{{locationName}}</location>"
          values={{ author: activityAuthorName(activity), newName, locationName: project?.name ?? space.name }}
          components={{ task: typeof name === "string" ? <></> : name, location }}
        />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    if (hasAggregatedTasks(activity)) return null;

    const { oldName } = content(activity);

    return <Trans i18nKey={'Previously, the task was named "{{oldName}}".'} values={{ oldName }} />;
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
    const { newName, oldName } = content(props.activity);
    return i18n.t('Task "{{oldName}}" was renamed to "{{newName}}"', { oldName, newName });
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentTaskNameUpdating {
  return activity.content as ActivityContentTaskNameUpdating;
}

export default TaskNameUpdating;
