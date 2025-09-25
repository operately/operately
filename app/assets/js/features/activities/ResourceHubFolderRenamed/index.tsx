import React from "react";

import type { ActivityContentResourceHubFolderRenamed } from "@/api";
import type { Activity } from "@/models/activities";

import { assertPresent } from "@/utils/assertions";
import { feedTitle, folderLink, spaceLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const ResourceHubFolderRenamed: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const folder = content(activity).folder;
    assertPresent(folder?.id, "folder.id must be present in ResourceHubFolderRenamed activity content");

    return paths.resourceHubFolderPath(folder.id);
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

    const space = spaceLink(data.space!);
    const folder = folderLink(data.folder!);

    if (page === "space") {
      return feedTitle(activity, "renamed the", folder, "folder");
    } else {
      return feedTitle(activity, "renamed the", folder, "folder in the", space, "space");
    }
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
    return "Renamed a folder: " + content(activity).folder!.name!;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubFolderRenamed {
  return activity.content as ActivityContentResourceHubFolderRenamed;
}

export default ResourceHubFolderRenamed;
