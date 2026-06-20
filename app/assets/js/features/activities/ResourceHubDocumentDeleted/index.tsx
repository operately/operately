import type { ActivityContentResourceHubDocumentDeleted } from "@/api";
import type { Activity } from "@/models/activities";

import { feedTitle, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubDocumentDeleted: ActivityHandler = {
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
    const resourceHub = data.resourceHub ? resourceHubLink(data.resourceHub, { project: data.project, goal: data.goal }) : "the resource hub";
    const documentName = data.document?.name ?? "a document";
    const parent = visibleParentDescriptor(page, data);

    if (!parent) {
      return feedTitle(activity, `deleted "${documentName}" from`, resourceHub);
    }

    return feedTitle(activity, `deleted "${documentName}" from`, resourceHub, "in the", parent.link, parent.label);
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
    return "Deleted a document: " + (content(activity).document?.name ?? "a document");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentDeleted {
  return activity.content as ActivityContentResourceHubDocumentDeleted;
}

export default ResourceHubDocumentDeleted;
