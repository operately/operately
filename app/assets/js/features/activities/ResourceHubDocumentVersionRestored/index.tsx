import type { ActivityContentResourceHubDocumentVersionRestored } from "@/api";
import type { Activity } from "@/models/activities";

import { feedTitle, documentLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubDocumentVersionRestored: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);

    if (data.document?.id) {
      return paths.resourceHubDocumentPath(data.document.id);
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
    const document = data.document;
    const parent = visibleParentDescriptor(page, data);

    if (!document) {
      return feedTitle(activity, "restored a document to a previous version");
    }

    const doc = documentLink(document);

    if (!parent) {
      return feedTitle(activity, "restored", doc, "to a previous version");
    }

    return feedTitle(activity, "restored", doc, "to a previous version", "in the", parent.link, parent.label);
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    return "Restored a document version";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentVersionRestored {
  return activity.content as ActivityContentResourceHubDocumentVersionRestored;
}

export default ResourceHubDocumentVersionRestored;
