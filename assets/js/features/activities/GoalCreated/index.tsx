import type { Activity } from "@/models/activities";
import type { ActivityContentGoalCreated } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, goalLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";

const GoalCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.goalPath(content(activity).goal!.id!);
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

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    const myRole = content(activity).myRole!;
    var result = People.firstName(author) + " added a new goal and";

    switch (myRole) {
      case "champion":
        result += " assigned you as the champion";
        break;
      case "reviewer":
        result += " assigned you as the reviewer";
        break;
      default:
        result += " assigned you as a contributor";
        break;
    }

    return result;
  },
};

function content(activity: Activity): ActivityContentGoalCreated {
  return activity.content as ActivityContentGoalCreated;
}

export default GoalCreated;
