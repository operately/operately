import React from "react";

import type { ActivityContentTaskNameUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, projectLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const TaskNameUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    return paths.projectPath(content(activity).project.id);
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
    const { project, newName, task } = content(activity);

    if (page === "project") {
      return feedTitle(activity, "renamed task to", taskLink(task, newName));
    } else {
      return feedTitle(activity, "renamed task to", taskLink(task, newName), "in", projectLink(project));
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { oldName } = content(activity);

    return (
      <>
        Previously, the task was named "{oldName}".
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
    const { newName, oldName } = content(props.activity);
    return `Task "${oldName}" was renamed to "${newName}"`;
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentTaskNameUpdating {
  return activity.content as ActivityContentTaskNameUpdating;
}

export default TaskNameUpdating;
