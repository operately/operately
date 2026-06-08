import type { ActivityContentResourceHubLinkCreated } from "@/api";
import type { Activity } from "@/models/activities";

import { assertPresent } from "@/utils/assertions";
import { feedTitle, linkLink, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubParentScope } from "../resourceHubActivityContext";

const ResourceHubLinkCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const link = content(activity).link;
    assertPresent(link?.id, "link.id must be present in ResourceHubLinkCreated activity content");

    return paths.resourceHubLinkPath(link.id);
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

    if (page === "space" || page === "project") {
      return feedTitle(activity, "added a link:", link);
    }

    const resourceHub = data.resourceHub ? resourceHubLink(data.resourceHub) : "Documents & Files";

    return feedTitle(activity, "added a link to", resourceHub, ...resourceHubParentScope(data, page, ":"), link);
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
    return "Added a link: " + content(activity).link?.name;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkCreated {
  return activity.content as ActivityContentResourceHubLinkCreated;
}

export default ResourceHubLinkCreated;
