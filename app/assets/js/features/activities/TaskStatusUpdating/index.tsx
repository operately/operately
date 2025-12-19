import React from "react";

import type { ActivityContentTaskStatusUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, projectLink, spaceLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const { project, space, task, newStatus, name } = content(activity);
    const taskName = task ? taskLink(task) : `the "${name}" task`;

    const message = ["marked", taskName, "as", newStatus.label];
    const location = project ? projectLink(project) : spaceLink(space);

    if (page === "project") {
      return feedTitle(activity, ...message);
    } else if (page === "space" && !project) {
      return feedTitle(activity, ...message);
    } else {
      return feedTitle(activity, ...message, "in", location);
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { oldStatus, newStatus } = content(activity);

    return (
      <>
        Previously, the task was {oldStatus.label}. Now it's {newStatus.label}.
      </>
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

    return `Task "${name}" was marked as ${newStatus.label}`;
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
