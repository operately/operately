import * as People from "@/models/people";

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

  FeedItemTitle({ activity }: { activity: Activity }) {
    const data = content(activity);

    assertPresent(data.goal, "goal must be present in activity");
    assertPresent(data.newParentGoal, "newParentGoal must be present in activity");

    const goal = goalLink(data.goal);
    const newParent = goalLink(data.newParentGoal);

    if (data.oldParentGoal) {
      const oldParent = goalLink(data.oldParentGoal);
      return feedTitle(activity, "changed the parent goal of", goal, "from", oldParent, "to", newParent);
    } else {
      return feedTitle(activity, "changed the parent goal of", goal, "to", newParent);
    }
  },

  FeedItemContent(_props: { activity: Activity }) {
    return null;
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
    return People.firstName(activity.author!) + " changed the parent goal of " + content(activity).goal!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalReparent {
  return activity.content as ActivityContentGoalReparent;
}

export default GoalReparent;
