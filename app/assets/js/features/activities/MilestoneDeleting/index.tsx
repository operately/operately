import type { ActivityContentMilestoneDeleting } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { feedTitle, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const MilestoneDeleting: ActivityHandler = {
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
    const { milestoneName, project } = content(props.activity);

    if (props.page === "project") {
      return feedTitle(props.activity, `deleted milestone "${milestoneName}"`);
    } else {
      return feedTitle(props.activity, `deleted milestone "${milestoneName}"`, "on", projectLink(project));
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
    const { milestoneName } = content(props.activity);
    return <>Milestone "{milestoneName}" was deleted</>;
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project } = content(props.activity);

    return <>Project: {project?.name}</>;
  },
};

function content(activity: Activity): ActivityContentMilestoneDeleting {
  return activity.content as ActivityContentMilestoneDeleting;
}

export default MilestoneDeleting;
