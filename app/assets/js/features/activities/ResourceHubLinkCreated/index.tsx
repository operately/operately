import type { ActivityContentResourceHubLinkCreated } from "@/api";
import type { Activity } from "@/models/activities";

import { feedTitle, linkLink, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubLinkCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);

    if (data.link?.id) {
      return paths.resourceHubLinkPath(data.link.id);
    }

    return resourceHubPathOrParent(paths, data);
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
    const link = data.link ? linkLink(data.link) : "a link";
    const resourceHub = data.resourceHub ? resourceHubLink(data.resourceHub) : null;
    const parent = visibleParentDescriptor(page, data);

    if (!parent) {
      return feedTitle(activity, "added a link:", link);
    }

    if (resourceHub) {
      return feedTitle(activity, "added a link to", resourceHub, "in the", parent.link, `${parent.label}:`, link);
    }

    return feedTitle(activity, "added a link in the", parent.link, `${parent.label}:`, link);
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
    return "Added a link: " + (content(activity).link?.name ?? "a link");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkCreated {
  return activity.content as ActivityContentResourceHubLinkCreated;
}

export default ResourceHubLinkCreated;
