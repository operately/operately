import * as People from "@/models/people";
import React from "react";

import type { ActivityContentProjectReviewerUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const ProjectReviewerUpdating: ActivityHandler = {
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
    const newReviewer = content(activity).newReviewer;
    const message = newReviewer ? `assigned ${People.shortName(newReviewer)} as the reviewer` : "removed the reviewer";

    if (page === "project") {
      return feedTitle(activity, message);
    } else {
      return feedTitle(activity, message, "on", projectLink(project));
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const oldReviewer = content(activity).oldReviewer;

    if (oldReviewer) {
      return <>Previously, {People.shortName(oldReviewer)} was the reviewer.</>;
    } else {
      return <>There was no previous reviewer.</>;
    }
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
    return People.firstName(props.activity.author!) + " assigned you as the reviewer";
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectReviewerUpdating {
  return activity.content as ActivityContentProjectReviewerUpdating;
}

export default ProjectReviewerUpdating;
