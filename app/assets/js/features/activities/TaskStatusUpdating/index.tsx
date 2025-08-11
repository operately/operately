import React from "react";

import type { ActivityContentTaskStatusUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const TaskStatusUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    return paths.projectPath(content(activity).project!.id!);
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
    const project = content(activity).project!;
    const task = content(activity).task!;
    const newStatus = content(activity).newStatus;
    const statusText = newStatus === "done" ? "completed" : `marked as ${newStatus}`;
    const message = `${statusText} task "${task.name}"`;

    if (page === "project") {
      return feedTitle(activity, message);
    } else {
      return feedTitle(activity, message, "in", projectLink(project));
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const oldStatus = content(activity).oldStatus;
    const newStatus = content(activity).newStatus;

    return <>Previously, the task was {oldStatus}. Now it's {newStatus}.</>;
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
    const task = content(props.activity).task!;
    const newStatus = content(props.activity).newStatus;
    const statusText = newStatus === "done" ? "completed" : `marked as ${newStatus}`;
    return `Task "${task.name}" was ${statusText}`;
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentTaskStatusUpdating {
  return activity.content as ActivityContentTaskStatusUpdating;
}

export default TaskStatusUpdating;
