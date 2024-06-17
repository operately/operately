import type { Activity } from "@/models/activities";
import type { ActivityContentGoalArchived } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, goalLink } from "../feedItemLinks";

const GoalArchived: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity): string {
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

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  CommentNotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

function content(activity: Activity): ActivityContentGoalArchived {
  return activity.content as ActivityContentGoalArchived;
}

export default GoalArchived;
