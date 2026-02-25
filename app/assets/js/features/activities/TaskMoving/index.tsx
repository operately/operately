import React from "react";
import type { ActivityContentTaskMoving } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";
import { feedTitle, projectLink, spaceLink, taskLink } from "../feedItemLinks";

const TaskMoving: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    const task = data.task;

    if (data.destinationType === "space") {
      if (data.destinationSpace?.id && task?.id) return paths.spaceKanbanPath(data.destinationSpace.id, { taskId: task.id });
      if (data.destinationSpace?.id) return paths.spaceKanbanPath(data.destinationSpace.id);
      return paths.homePath();
    }

    if (task?.id) return paths.taskPath(task.id);
    if (data.destinationProject?.id) return paths.projectPath(data.destinationProject.id, { tab: "tasks" });

    return paths.homePath();
  },

  PageTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity }: { activity: Activity; page: any }) {
    const data = content(activity);
    const movedTask =
      data.task && data.destinationType === "space" && data.destinationSpace?.id
        ? taskLink(data.task, { spaceId: data.destinationSpace.id })
        : data.task
          ? taskLink(data.task)
          : `"${data.taskName}"`;

    return feedTitle(activity, "moved the task", movedTask, "to", destinationLabel(data));
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const data = content(activity);

    return (
      <>
        Previously, it was in {originLabel(data)}
      </>
    );
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    const data = content(activity);
    return `Moved task "${data.taskName}" to ${destinationName(data)}`;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return destinationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentTaskMoving {
  return activity.content as ActivityContentTaskMoving;
}

function originLabel(data: ActivityContentTaskMoving) {
  if (data.originProject) return projectLink(data.originProject);
  if (data.originSpace) return spaceLink(data.originSpace);
  return data.originType === "project" ? "a project" : "a space";
}

function destinationLabel(data: ActivityContentTaskMoving) {
  if (data.destinationProject) return projectLink(data.destinationProject);
  if (data.destinationSpace) return spaceLink(data.destinationSpace);
  return data.destinationType === "project" ? "a project" : "a space";
}

function destinationName(data: ActivityContentTaskMoving) {
  return data.destinationProject?.name || data.destinationSpace?.name || "another destination";
}

export default TaskMoving;
