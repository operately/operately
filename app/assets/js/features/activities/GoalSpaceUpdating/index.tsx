import React from "react";

import type { ActivityContentGoalSpaceUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, goalLink, spaceLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const GoalSpaceUpdating: ActivityHandler = {
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

  FeedItemTitle(props: { activity: Activity }) {
    const goal = content(props.activity).goal!;
    const space = content(props.activity).space!;

    return feedTitle(props.activity, "moved the", goalLink(goal), "goal to", spaceLink(space));
  },

  FeedItemContent(props: { activity: Activity }) {
    const space = content(props.activity).oldSpace!;

    return <>Previously, it was in the {spaceLink(space)} space.</>;
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

function content(activity: Activity): ActivityContentGoalSpaceUpdating {
  return activity.content as ActivityContentGoalSpaceUpdating;
}

export default GoalSpaceUpdating;
