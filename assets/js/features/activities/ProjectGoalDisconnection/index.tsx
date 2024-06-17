import type { Activity } from "@/models/activities";
import type { ActivityContentProjectGoalDisconnection } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, projectLink, goalLink } from "../feedItemLinks";

const ProjectGoalDisconnection: ActivityHandler = {
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
    const goal = goalLink(content(activity).goal!);
    const project = projectLink(content(activity).project!);

    if (page === "project") {
      return feedTitle(activity, "disconnected the project from the", goal, "goal");
    } else if (page === "goal") {
      return feedTitle(activity, "disconnected the", project, "project from the goal");
    } else {
      return feedTitle(activity, "disconnected the", project, "project from the", goal, "goal");
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

function content(activity: Activity): ActivityContentProjectGoalDisconnection {
  return activity.content as ActivityContentProjectGoalDisconnection;
}

export default ProjectGoalDisconnection;
