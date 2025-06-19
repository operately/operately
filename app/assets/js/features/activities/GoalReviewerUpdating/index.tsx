import * as People from "@/models/people";
import React from "react";

import type { ActivityContentGoalReviewerUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, goalLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const GoalReviewerUpdating: ActivityHandler = {
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const goal = content(activity).goal!;
    const newReviewer = content(activity).newReviewer;
    const message = newReviewer ? `assigned ${People.shortName(newReviewer)} as the reviewer` : "removed the reviewer";

    if (page === "goal") {
      return feedTitle(activity, message);
    } else {
      return feedTitle(activity, message, "on", goalLink(goal));
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

  NotificationTitle(_props: { activity: Activity }) {
    return <></>;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentGoalReviewerUpdating {
  return activity.content as ActivityContentGoalReviewerUpdating;
}

export default GoalReviewerUpdating;
