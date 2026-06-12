import React from "react";

import type { ActivityContentResourceHubFolderRenamed } from "@/api";
import type { Activity } from "@/models/activities";

import { feedTitle, folderLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubFolderPathOrParent, resourceHubParentParts } from "../resourceHubActivity";

const ResourceHubFolderRenamed: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
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
    const parentParts = resourceHubParentParts(page, data);

    if (parentParts.length === 0) {
      return feedTitle(activity, "renamed the", folder, "folder");
    }

    return feedTitle(activity, "renamed the", folder, "folder", ...parentParts);
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    return (
      <>
        <span className="line-through">{content(activity).oldName}</span> → {content(activity).newName}
      </>
    );
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
    return "Renamed a folder: " + (content(activity).folder?.name ?? "a folder");
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubFolderRenamed {
  return activity.content as ActivityContentResourceHubFolderRenamed;
}

export default ResourceHubFolderRenamed;
