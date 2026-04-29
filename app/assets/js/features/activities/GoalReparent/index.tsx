import React from "react";

import { Activity, ActivityContentGoalReparent } from "@/api";

import { feedTitle, goalLink } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const GoalReparent: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const goalId = content(activity).goal?.id;

    return goalId ? paths.goalPath(goalId) : paths.workMapPath();
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
    const data = content(activity);
    const goal = data.goal ? goalLink(data.goal) : null;

    if (page === "goal" || !goal) {
      return feedTitle(activity, "changed the parent goal");
    } else {
      return feedTitle(activity, "changed the parent goal of", goal);
    }
  },

  FeedItemContent(props: { activity: Activity }) {
    const { newParentGoal, oldParentGoal } = content(props.activity);

    const oldParentLink = oldParentGoal ? goalLink(oldParentGoal) : null;
    const newParentLink = newParentGoal ? goalLink(newParentGoal) : null;

    if (newParentGoal && oldParentGoal) {
      return (
        <>
          Changed the parent goal from {oldParentLink} to {newParentLink}.
        </>
      );
    }

    if (newParentGoal) {
      return <>Changed the parent goal to {newParentLink}.</>;
    }

    if (oldParentGoal) {
      return <>Removed the parent goal {oldParentLink}.</>;
    }

    return <>No parent goal was set.</>;
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

  NotificationTitle({ activity }: { activity: Activity }) {
    const goalName = content(activity).goal?.name;

    return goalName ? "Changed the parent goal of " + goalName : "Changed a goal's parent goal";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const data = content(activity);

    return data.goal?.name ?? data.newParentGoal?.name ?? data.oldParentGoal?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentGoalReparent {
  return activity.content as ActivityContentGoalReparent;
}

export default GoalReparent;
