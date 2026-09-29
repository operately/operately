import type { ActivityContentTaskCommentDeleting } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { Link } from "turboui";
import { Trans } from "../i18n";
import { activityAuthorName, projectLink, spaceLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const TaskCommentDeleting: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { project, space, task } = content(activity);

    if (task && project) {
      return paths.taskPath(task.id);
    }

    if (task) {
      return paths.spaceKanbanPath(space.id, { taskId: task.id });
    }

    if (project) {
      return paths.projectPath(project.id, { tab: "tasks" });
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
    const { project, space, task, taskName } = content(activity);
    const taskLink = task ? <Link to={taskPath(paths, activity)}>{null}</Link> : <React.Fragment />;
    const values = {
      author: activityAuthorName(activity),
      taskName: task ? task.name : `"${taskName}"`,
      projectName: project?.name,
      spaceName: space.name,
    };

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} deleted a comment on <task>{{taskName}}</task>"
          values={values}
          components={{ task: taskLink }}
        />
      );
    }

    if (page === "space" && !project) {
      return (
        <Trans
          i18nKey="{{author}} deleted a comment on <task>{{taskName}}</task>"
          values={values}
          components={{ task: taskLink }}
        />
      );
    }

    if (project) {
      return (
        <Trans
          i18nKey="{{author}} deleted a comment on <task>{{taskName}}</task> in the <project>{{projectName}}</project> project"
          values={values}
          components={{ task: taskLink, project: projectLink(paths, project) }}
        />
      );
    }

    return (
      <Trans
        i18nKey="{{author}} deleted a comment on <task>{{taskName}}</task> in the <space>{{spaceName}}</space> space"
        values={values}
        components={{ task: taskLink, space: spaceLink(paths, space) }}
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

  NotificationTitle({ activity }: { activity: Activity }) {
    const { task, taskName } = content(activity);
    return <Trans i18nKey="Re: {{title}}" values={{ title: task?.name ?? taskName }} />;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const { project, space } = content(activity);

    if (project) {
      return project.name;
    }

    return space.name;
  },
};

function content(activity: Activity): ActivityContentTaskCommentDeleting {
  return activity.content as ActivityContentTaskCommentDeleting;
}

function taskPath(paths: Paths, activity: Activity) {
  const { project, space, task } = content(activity);

  if (task && project) {
    return paths.taskPath(task.id);
  }

  if (task) {
    return paths.spaceKanbanPath(space.id, { taskId: task.id });
  }

  if (project) {
    return paths.projectPath(project.id, { tab: "tasks" });
  }

  return paths.spaceKanbanPath(space.id);
}

export default TaskCommentDeleting;
