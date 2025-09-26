import React from "react";

import { Activity, ActivityContentGoalReparent } from "@/api";

import { assertPresent } from "@/utils/assertions";
import { feedTitle, goalLink } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const GoalReparent: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    assertPresent(data.goal?.id, "goal.id must be present in activity");

    return paths.goalPath(data.goal.id);
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
    assertPresent(data.goal, "goal must be present in activity");

    const goal = goalLink(data.goal);

    if (page === "goal") {
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
    return "Changed the parent goal of " + content(activity).goal!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalReparent {
  return activity.content as ActivityContentGoalReparent;
}

export default GoalReparent;
