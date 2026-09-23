import type { ActivityContentResourceHubDocumentPublicSharingChanged } from "@/api";
import React from "react";
import type { Activity } from "@/models/activities";
import { documentLink, feedTitle } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

function content(activity: Activity) {
  return activity.content as ActivityContentResourceHubDocumentPublicSharingChanged;
}

const handler: ActivityHandler = {
  pageHtmlTitle: () => "Document public sharing",
  pagePath: (paths, activity) => {
    const data = content(activity);
    return data.document ? paths.resourceHubDocumentPath(data.document.id) : resourceHubPathOrParent(paths, data);
  },
  PageTitle: () => <>Document public sharing</>,
  PageContent: () => <></>,
  PageOptions: () => null,
  FeedItemTitle: ({ activity, page, paths }) => {
    const data = content(activity);
    const action = data.enabled ? "enabled public sharing for" : "disabled public sharing for";
    const document = data.document ? documentLink(paths, data.document) : "a document";
    const parent = visibleParentDescriptor(paths, page, data);
    return parent
      ? feedTitle(activity, action, document, "in the", parent.link, parent.label)
      : feedTitle(activity, action, document);
  },
  FeedItemContent: () => null,
  feedItemAlignment: () => "items-start",
  commentCount: () => 0,
  hasComments: () => false,
  NotificationTitle: ({ activity }) =>
    content(activity).enabled ? "Enabled public sharing" : "Disabled public sharing",
  NotificationLocation: ({ activity }) => resourceHubLocationName(content(activity)),
};

export default handler;
