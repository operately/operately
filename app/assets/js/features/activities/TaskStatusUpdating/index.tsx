import React from "react";

import type { ActivityContentTaskStatusUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, projectLink, taskLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { StatusSelector } from "turboui";

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
    const { project, task, newStatus, name } = content(activity);
    const status = newStatus.replace("_", " ");
    const taskName = task ? taskLink(task) : `the "${name}" task`

    const message = ["marked", taskName, "as", status]

    if (page === "project") {
      return feedTitle(activity, ...message);
    } else {
      return feedTitle(activity, ...message, "in", projectLink(project));
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { oldStatus, newStatus } = content(activity);

    return (
      <>
        Previously, the task was{" "}
        <StatusSelector status={oldStatus as StatusSelector.Status} size="xs" onChange={() => {}} readonly showFullBadge />. Now it's{" "}
        <StatusSelector status={newStatus as StatusSelector.Status} size="xs" onChange={() => {}} readonly showFullBadge />.
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
    const statusText = newStatus === "done" ? "completed" : `marked as ${newStatus}`;

    return `Task "${name}" was ${statusText}`;
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentTaskStatusUpdating {
  return activity.content as ActivityContentTaskStatusUpdating;
}

export default TaskStatusUpdating;
