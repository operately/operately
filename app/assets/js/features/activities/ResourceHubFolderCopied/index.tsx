import * as React from "react";

import type { ActivityContentResourceHubFolderCopied } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, folderLink } from "../feedItemLinks";
import { resourceHubFolderPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubFolderCopied: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);

    return resourceHubFolderPathOrParent(paths, data.folder, data);
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
    const folder = data.folder ? folderLink(data.folder) : "a folder";
    const originalFolder = data.originalFolder ? folderLink(data.originalFolder) : "a folder";
    const parent = visibleParentDescriptor(page, data);

    if (!parent) {
      return feedTitle(activity, "made a copy of the", originalFolder, "folder and named it", folder);
    }

    return feedTitle(activity, "made a copy of the", originalFolder, "folder in the", parent.link, parent.label, "and named it", folder);
  },

  FeedItemContent({}: { activity: Activity }) {
    return <></>;
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return "Made a copy of a folder: " + (content(activity).folder?.name ?? "a folder");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).folder?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentResourceHubFolderCopied {
  return activity.content as ActivityContentResourceHubFolderCopied;
}

export default ResourceHubFolderCopied;
