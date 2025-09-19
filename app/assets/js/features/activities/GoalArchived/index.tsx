import * as People from "@/models/people";

import type { ActivityContentGoalArchived } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";


import { feedTitle, goalLink } from "../feedItemLinks";

const GoalArchived: ActivityHandler = {
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
      return feedTitle(activity, "archived this goal");
    } else {
      return feedTitle(activity, "archived the", goalLink(content(activity).goal!), "goal");
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
    return "Archived the " + content(activity).goal!.name! + " goal";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalArchived {
  return activity.content as ActivityContentGoalArchived;
}

export default GoalArchived;
