import type { Activity } from "@/models/activities";
import type { ActivityContentProjectArchived } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { projectLink, feedTitle } from "../feedItemLinks";

const ProjectArchived: ActivityHandler = {
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
    if (page === "project") {
      return feedTitle(activity, "archived the project");
    } else {
      return feedTitle(activity, "archived the", projectLink(content(activity).project!), "project");
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

function content(activity: Activity): ActivityContentProjectArchived {
  return activity.content as ActivityContentProjectArchived;
}

export default ProjectArchived;
