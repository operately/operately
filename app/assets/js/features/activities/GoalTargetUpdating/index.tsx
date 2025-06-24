import React from "react";

import type { ActivityContentGoalTargetUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, goalLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const GoalTargetUpdating: ActivityHandler = {
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
    const goal = content(activity).goal;
    const targetName = content(activity).targetName;
    const message = `updated the value for the ${targetName} target`;

    if (page === "goal") {
      return feedTitle(activity, message);
    } else {
      return feedTitle(activity, message, " on the", goalLink(goal));
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const oldValue = content(activity).oldValue;
    const newValue = content(activity).newValue;
    const unit = content(activity).unit;

    return (
      <>
        Previously, {oldValue} {unit}, now {newValue} {unit}.
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

  NotificationTitle(_props: { activity: Activity }) {
    return <></>;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentGoalTargetUpdating {
  return activity.content as ActivityContentGoalTargetUpdating;
}

export default GoalTargetUpdating;
