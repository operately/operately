import * as People from "@/models/people";

import type { ActivityContentGoalCreated } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { match } from "ts-pattern";
import { feedTitle, goalLink } from "../feedItemLinks";

const GoalCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalPath(content(activity).goal!.id!);
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    if (page === "goal") {
      return feedTitle(activity, "added this goal");
    } else {
      return feedTitle(activity, "added the", goalLink(content(activity).goal!), "goal");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
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
    const myRole = content(activity).goal!.myRole!;
    const person = People.firstName(activity.author!);
    const role = match(myRole)
      .with("champion", () => "the champion")
      .with("reviewer", () => "the reviewer")
      .otherwise(() => "a contributor");

    return person + " added a new goal and assigned you as " + role;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return goalLink(content(activity).goal!);
  },
};

function content(activity: Activity): ActivityContentGoalCreated {
  return activity.content as ActivityContentGoalCreated;
}

export default GoalCreated;
