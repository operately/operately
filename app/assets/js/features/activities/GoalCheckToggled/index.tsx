import type { ActivityContentGoalCheckToggled } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { feedTitle, goalLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const GoalCheckToggled: ActivityHandler = {
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
    const goal = content(props.activity).goal!;
    const message = content(props.activity).completed
      ? "marked a checklist item as completed"
      : "marked a checklist item as pending";

    if (props.page === "goal") {
      return feedTitle(props.activity, message);
    } else {
      return feedTitle(props.activity, message, "on", goalLink(goal));
    }
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    return <>Item: {content(props.activity).name}</>;
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

function content(activity: Activity): ActivityContentGoalCheckToggled {
  return activity.content as ActivityContentGoalCheckToggled;
}

export default GoalCheckToggled;
