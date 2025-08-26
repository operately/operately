import React from "react";

import type { ActivityContentMilestoneTitleUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, milestoneLink, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const MilestoneTitleUpdating: ActivityHandler = {
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
    const { project, milestone, newTitle } = content(activity);
    const title = milestone ? milestoneLink(milestone, newTitle) : `"${newTitle}"`;
    const message = `renamed milestone to`;

    if (page === "project") {
      return feedTitle(activity, message, title);
    } else {
      return feedTitle(activity, message, title, "in", projectLink(project));
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { oldTitle } = content(activity);

    return (
      <>
        Previously, the milestone was called <strong>"{oldTitle}"</strong>.
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
    const { newTitle } = content(props.activity);

    return `Milestone was renamed to "${newTitle}"`;
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentMilestoneTitleUpdating {
  return activity.content as ActivityContentMilestoneTitleUpdating;
}

export default MilestoneTitleUpdating;
