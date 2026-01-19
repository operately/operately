import type { ActivityContentTaskDeleting } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { feedTitle, projectLink, spaceLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const TaskDeleting: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { project, space } = content(activity);

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

  FeedItemTitle(props: { activity: Activity; page: string }) {
    const { taskName, project, space } = content(props.activity);
    const location = project ? projectLink(project) : spaceLink(space);

    if (props.page === "project") {
      return feedTitle(props.activity, `deleted task "${taskName}"`);
    } else if (props.page === "space" && !project) {
      return feedTitle(props.activity, `deleted task "${taskName}"`);
    } else {
      return feedTitle(props.activity, `deleted task "${taskName}"`, "in", location);
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null; // No additional content needed for deletion
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
    return <>Task "{taskName}" was deleted</>;
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project, space } = content(props.activity);

    if (project) {
      return <>Project: {project.name}</>;
    }
    return <>Space: {space.name}</>;
  },
};

function content(activity: Activity): ActivityContentTaskDeleting {
  return activity.content as ActivityContentTaskDeleting;
}

export default TaskDeleting;
