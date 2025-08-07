import React from "react";

import type { ActivityContentProjectMilestoneCreation } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const ProjectMilestoneCreation: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_paths: Paths, _activity: Activity) {
    throw new Error("Not implemented");
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
    const project = content(props.activity).project!;
    const milestoneName = content(props.activity).milestoneName!;
    const message = `added the ${milestoneName} milestone`;

    if (props.page === "project") {
      return feedTitle(props.activity, message);
    } else {
      return feedTitle(props.activity, message, "to", projectLink(project));
    }
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

  NotificationTitle(_props: { activity: Activity }) {
    return <></>;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentProjectMilestoneCreation {
  return activity.content as ActivityContentProjectMilestoneCreation;
}

export default ProjectMilestoneCreation;
