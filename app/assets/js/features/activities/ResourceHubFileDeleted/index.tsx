import type { ActivityContentResourceHubFileDeleted } from "@/api";
import type { Activity } from "@/models/activities";

import { feedTitle, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubLocationName, resourceHubParentParts, resourceHubPathOrParent } from "../resourceHubActivity";

const ResourceHubFileDeleted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    return resourceHubPathOrParent(paths, content(activity));
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
    const data = content(activity);
    const resourceHub = data.resourceHub ? resourceHubLink(data.resourceHub) : "the resource hub";
    const fileName = data.file?.name ?? "a file";

    return feedTitle(activity, `deleted "${fileName}" from`, resourceHub, ...resourceHubParentParts(page, data));
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
    return "Deleted a file: " + (content(activity).file?.name ?? "a file");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubFileDeleted {
  return activity.content as ActivityContentResourceHubFileDeleted;
}

export default ResourceHubFileDeleted;
