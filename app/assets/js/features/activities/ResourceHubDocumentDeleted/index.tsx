import type { ActivityContentResourceHubDocumentDeleted } from "@/api";
import type { Activity } from "@/models/activities";

import { feedTitle, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubParentScope } from "../resourceHubActivityContext";

const ResourceHubDocumentDeleted: ActivityHandler = {
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
    const data = content(activity);

    const resourceHub = resourceHubLink(data.resourceHub!);
    const document = content(activity).document!;

    if (page === "space" || page === "project") {
      return feedTitle(activity, `deleted "${document.name}" from`, resourceHub);
    } else {
      return feedTitle(activity, `deleted "${document.name}" from`, resourceHub, ...resourceHubParentScope(data, page));
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
    return "Deleted a document: " + content(activity).document!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).resourceHub!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentDeleted {
  return activity.content as ActivityContentResourceHubDocumentDeleted;
}

export default ResourceHubDocumentDeleted;
