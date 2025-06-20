import React from "react";

import type { ActivityContentGoalNameUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, goalLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const GoalNameUpdating: ActivityHandler = {
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
    const { goal } = content(props.activity);

    if (props.page === "goal") {
      return feedTitle(props.activity, "renamed the goal");
    } else {
      return feedTitle(props.activity, "renamed", goalLink(goal!));
    }
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    const { newName, oldName } = content(props.activity);

    return (
      <>
        Previously it was {oldName}, now it is {newName}.
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

function content(activity: Activity): ActivityContentGoalNameUpdating {
  return activity.content as ActivityContentGoalNameUpdating;
}

export default GoalNameUpdating;
