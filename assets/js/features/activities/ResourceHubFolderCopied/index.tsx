import * as React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubFolderCopied } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { feedTitle, folderLink, spaceLink } from "../feedItemLinks";

const ResourceHubFolderCopied: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    const folder = content(activity).folder;
    assertPresent(folder?.id, "folder.id must be present in ResourceHubFolderCreated activity content");

    return Paths.resourceHubFolderPath(folder.id);
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
    const originalFolder = folderLink(data.originalFolder!);

    if (page === "space") {
      return feedTitle(activity, "made a copy of the", originalFolder, "folder and named it", folder);
    } else {
      return feedTitle(
        activity,
        "made a copy of the",
        originalFolder,
        "folder in the",
        space,
        "space and named it",
        folder,
      );
    }
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
    return People.firstName(activity.author!) + " made a copy of a folder: " + content(activity).folder!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).folder!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubFolderCopied {
  return activity.content as ActivityContentResourceHubFolderCopied;
}

export default ResourceHubFolderCopied;
