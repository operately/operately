import type { ActivityContentTaskAdding } from "@/api";
import i18n, { translationText } from "@/i18n";
import type { Activity } from "@/models/activities";
import * as People from "@/models/people";
import { Paths } from "@/routes/paths";
import React from "react";
import { Trans } from "react-i18next";
import { Link } from "turboui";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { hasAggregatedTasks, UpdatedTaskList } from "../taskUpdatedResources";

const TaskAdding: ActivityHandler = {
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
    const { project, space, taskName, task } = content(activity);
    const author = People.firstName(activity.author);
    const locationName = project?.name ?? space?.name;
    const showLocation = page !== "project" && page !== "task" && !(page === "space" && !project);
    const location = locationAnchor(paths, project, space);

    if (hasAggregatedTasks(activity)) {
      const tasks = <UpdatedTaskList activity={activity} paths={paths} />;

      if (showLocation) {
        return (
          <Trans
            i18nKey="{{author}} added tasks <tasks/> in <location>{{locationName}}</location>"
            values={{ author, locationName }}
            components={{ tasks, location }}
          />
        );
      }

      return <Trans i18nKey="{{author}} added tasks <tasks/>" values={{ author }} components={{ tasks }} />;
    }

    const name = task?.name ?? taskName;
    const taskAnchor = taskLinkAnchor(paths, task, project, space);

    if (!task) {
      if (showLocation) {
        return (
          <Trans
            i18nKey={'{{author}} added the task "{{taskName}}" in <location>{{locationName}}</location>'}
            values={{ author, taskName: name, locationName }}
            components={{ location }}
          />
        );
      }

      return <Trans i18nKey={'{{author}} added the task "{{taskName}}"'} values={{ author, taskName: name }} />;
    }

    if (showLocation) {
      return (
        <Trans
          i18nKey="{{author}} added the task <task>{{taskName}}</task> in <location>{{locationName}}</location>"
          values={{ author, taskName: name, locationName }}
          components={{ task: taskAnchor, location }}
        />
      );
    }

    return (
      <Trans
        i18nKey="{{author}} added the task <task>{{taskName}}</task>"
        values={{ author, taskName: name }}
        components={{ task: taskAnchor }}
      />
    );
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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
    const { taskName } = content(props.activity);
    return translationText(i18n.t('New task "{{taskName}}" was created', { taskName }));
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project, space } = content(props.activity);

    if (project) {
      return project.name;
    }

    return space.name;
  },
};

function content(activity: Activity): ActivityContentTaskAdding {
  return activity.content as ActivityContentTaskAdding;
}

function locationAnchor(
  paths: Paths,
  project: ActivityContentTaskAdding["project"],
  space: ActivityContentTaskAdding["space"],
) {
  if (project?.id) return <Link to={paths.projectPath(project.id)}>{null}</Link>;
  if (space?.id) return <Link to={paths.spacePath(space.id)}>{null}</Link>;
  return <span />;
}

function taskLinkAnchor(
  paths: Paths,
  task: ActivityContentTaskAdding["task"],
  project: ActivityContentTaskAdding["project"],
  space: ActivityContentTaskAdding["space"],
) {
  if (!task?.id) return <span />;

  const path = !project && space?.id ? paths.spaceKanbanPath(space.id, { taskId: task.id }) : paths.taskPath(task.id);

  return <Link to={path}>{null}</Link>;
}

export default TaskAdding;
