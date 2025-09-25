import type { ActivityContentResourceHubLinkDeleted } from "@/api";
import type { Activity } from "@/models/activities";

import { feedTitle, resourceHubLink, spaceLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const ResourceHubLinkDeleted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    return paths.resourceHubPath(content(activity).resourceHub!.id!);
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
    const resourceHub = resourceHubLink(content(activity).resourceHub!);
    const space = spaceLink(content(activity).space!);
    const link = content(activity).link!.name!;

    if (page === "space") {
      return feedTitle(activity, `deleted the "${link}" link from`, resourceHub);
    } else {
      return feedTitle(activity, `deleted the "${link}" link from`, resourceHub, "in the", space, "space");
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
    return "Deleted a link: " + content(activity).link!.name!;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkDeleted {
  return activity.content as ActivityContentResourceHubLinkDeleted;
}

export default ResourceHubLinkDeleted;
